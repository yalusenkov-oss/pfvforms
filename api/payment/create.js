// POST /api/payment/create
// Creates a YooKassa payment and returns the confirmation URL
import crypto from 'crypto';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

export default async function handler(req, res) {
  // Read env vars lazily (after dotenv.config() has run in server.js)
  const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
  const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
  const SITE_URL = process.env.SITE_URL || 'https://pfvmusic.digital';

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    // Idempotence key to prevent duplicate payments
    const idempotenceKey = crypto.randomUUID();

    const paymentData = {
      amount: {
        value: Number(amount).toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${SITE_URL}?paymentComplete=true#distribution`,
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
