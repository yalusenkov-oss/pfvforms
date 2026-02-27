// GET /api/payment/status?paymentId=xxx
// Checks the status of a YooKassa payment

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    return res.status(500).json({ success: false, error: 'Payment system not configured' });
  }

  const paymentId = req.query?.paymentId || new URL(req.url, 'http://localhost').searchParams.get('paymentId');

  if (!paymentId) {
    return res.status(400).json({ success: false, error: 'Missing paymentId' });
  }

  try {
    const authHeader = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');

    const response = await fetch(`${YOOKASSA_API_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[payment/status] YooKassa error:', result);
      return res.status(response.status).json({
        success: false,
        error: result.description || result.message || 'Failed to get payment status',
      });
    }

    console.log('[payment/status] Payment', paymentId, 'status:', result.status);

    return res.status(200).json({
      success: true,
      paymentId: result.id,
      status: result.status,
      paid: result.paid || false,
      amount: result.amount,
      description: result.description || '',
      metadata: result.metadata || {},
      capturedAt: result.captured_at || null,
      cancellationDetails: result.cancellation_details || null,
    });
  } catch (error) {
    console.error('[payment/status] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
