// POST /api/payment/create
// Creates a YooKassa payment and returns the confirmation URL
import crypto from 'crypto';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

// ═══ Server-side price calculation (must match frontend) ═══
const PRICES = {
  basic:    { single: 500,  ep: 700,  album: 900  },
  advanced: { single: 690,  ep: 890,  album: 1200 },
  premium:  { single: 1200, ep: 1690, album: 2290 },
  platinum: { single: 4990, ep: 6490, album: 7990 },
};
const KARAOKE_PRICES = { basic: 350, advanced: 195, premium: 140, platinum: 0 };
const VIDEOSHOT_PRICE = 1000;
const TARIFF_MAP = { 'Базовый': 'basic', 'Продвинутый': 'advanced', 'Премиум': 'premium', 'Платинум': 'platinum' };
const RELEASE_MAP = { 'Single': 'single', 'EP': 'ep', 'Album': 'album' };

function calculateExpectedPrice(metadata) {
  if (!metadata) return null;
  const tariff = TARIFF_MAP[metadata.tariff] || metadata.tariff;
  const releaseType = RELEASE_MAP[metadata.releaseType] || metadata.releaseType;
  if (!tariff || !releaseType || !PRICES[tariff]?.[releaseType]) return null;

  const trackCount = parseInt(metadata.trackCount || '1', 10) || 1;
  const base = PRICES[tariff][releaseType];
  const karaoke = metadata.addKaraoke === 'yes' ? (KARAOKE_PRICES[tariff] || 0) * trackCount : 0;
  const videoshot = metadata.addVideoshot === 'yes' ? VIDEOSHOT_PRICE : 0;
  return base + karaoke + videoshot;
  // Note: promo discount applied client-side — we verify pre-discount base is plausible
}

// ═══ CORS helper ═══
const ALLOWED_ORIGINS = ['https://pfvmusic.digital', 'https://www.pfvmusic.digital'];
function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return 'https://pfvmusic.digital';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) return requestOrigin;
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return 'https://pfvmusic.digital';
}

export default async function handler(req, res) {
  // Read env vars lazily (after dotenv.config() has run in server.js)
  const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
  const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
  const SITE_URL = process.env.SITE_URL || 'https://pfvmusic.digital';
  const requestOrigin = req.headers.origin || '';
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin);
  const returnBaseUrl = (isLocalOrigin ? requestOrigin : SITE_URL).replace(/\/$/, '');

  // CORS — restrict to known origins
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(requestOrigin));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    console.error('[payment/create] Missing YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY');
    return res.status(500).json({ success: false, error: 'Payment system not configured' });
  }

  try {
    const { amount, description, metadata, email } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Server-side price verification — guard against client-side manipulation
    const expectedBase = calculateExpectedPrice(metadata);
    if (expectedBase !== null) {
      // Amount can be <= expectedBase (promo discount applied), but never MORE
      if (Number(amount) > expectedBase) {
        console.error(`[payment/create] Price mismatch: client sent ${amount}, expected max ${expectedBase}`);
        return res.status(400).json({ success: false, error: 'Price verification failed' });
      }
      // Amount should be at least 1 RUB (YooKassa minimum) unless free (0)
      if (Number(amount) < 1) {
        return res.status(400).json({ success: false, error: 'Amount too low for payment' });
      }
    }

    // Idempotence key to prevent duplicate payments
    const idempotenceKey = crypto.randomUUID();

    const paymentData = {
      amount: {
        value: Number(amount).toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${returnBaseUrl}?paymentComplete=true#distribution`,
      },
      capture: true, // Auto-capture (one-stage payment)
      description: description || 'Оплата дистрибуции PFVMUSIC',
      metadata: metadata || {},
      // Чек (обязательно для ИП) — 54-ФЗ
      receipt: {
        customer: {
          email: email || metadata?.email || 'support@pfvmusic.digital',
        },
        items: [
          {
            description: (description || 'Услуга дистрибуции PFVMUSIC').slice(0, 128),
            quantity: '1.00',
            amount: {
              value: Number(amount).toFixed(2),
              currency: 'RUB',
            },
            vat_code: 1,               // Без НДС (ИП на УСН)
            payment_subject: 'service', // Услуга
            payment_mode: 'full_payment',
          },
        ],
      },
    };

    console.log('[payment/create] Creating payment:', JSON.stringify(paymentData, null, 2));

    const authHeader = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');

    const response = await fetch(YOOKASSA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`,
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[payment/create] YooKassa error:', result);
      return res.status(response.status).json({
        success: false,
        error: result.description || result.message || 'Payment creation failed',
      });
    }

    console.log('[payment/create] Payment created:', result.id, 'Status:', result.status);

    return res.status(200).json({
      success: true,
      paymentId: result.id,
      confirmationUrl: result.confirmation?.confirmation_url || '',
      status: result.status,
    });
  } catch (error) {
    console.error('[payment/create] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
