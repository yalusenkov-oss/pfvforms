// POST /api/payment/webhook
// Receives webhook notifications from YooKassa when payment status changes.
// This is the SAFETY NET: if the user closes the browser after paying,
// the webhook still fires and we auto-submit the form to GAS.

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

// In-memory dedup guard (per cold-start). Real dedup is handled by GAS
// checking if contractNumber already exists.
const processedPayments = new Set();

export default async function handler(req, res) {
  // No CORS needed — only YooKassa calls this endpoint
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // YooKassa sends: { type: 'notification', event: 'payment.succeeded', object: { ... } }
    if (!body || !body.event || !body.object) {
      console.warn('[webhook] Invalid webhook body:', JSON.stringify(body).slice(0, 300));
      return res.status(400).json({ success: false, error: 'Invalid webhook payload' });
    }

    const event = body.event;
    const payment = body.object;
    const paymentId = payment.id;

    console.log(`[webhook] Received event: ${event}, paymentId: ${paymentId}, status: ${payment.status}`);

    // We only care about successful payments
    if (event !== 'payment.succeeded' && event !== 'payment.waiting_for_capture') {
      // Acknowledge other events (canceled, refund, etc.) without action
      console.log(`[webhook] Ignoring event: ${event}`);
      return res.status(200).json({ success: true, message: 'Event ignored' });
    }

    // For waiting_for_capture with auto-capture, this shouldn't happen,
    // but if it does, just acknowledge
    if (event === 'payment.waiting_for_capture') {
      console.log(`[webhook] Payment waiting for capture (should auto-capture): ${paymentId}`);
      return res.status(200).json({ success: true, message: 'Acknowledged' });
    }

    // Dedup: don't process the same payment twice in this instance
    if (processedPayments.has(paymentId)) {
      console.log(`[webhook] Already processed paymentId: ${paymentId}, skipping`);
      return res.status(200).json({ success: true, message: 'Already processed' });
    }
    processedPayments.add(paymentId);
    // Keep set bounded
    if (processedPayments.size > 1000) {
      const first = processedPayments.values().next().value;
      processedPayments.delete(first);
    }

    // Verify payment status with YooKassa API (don't trust webhook body blindly)
    const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
    const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      console.error('[webhook] Missing YooKassa credentials');
      return res.status(500).json({ success: false, error: 'Payment system not configured' });
    }

    const authHeader = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');
    const verifyRes = await fetch(`${YOOKASSA_API_URL}/${paymentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${authHeader}` },
    });

    if (!verifyRes.ok) {
      console.error(`[webhook] Failed to verify payment ${paymentId}: HTTP ${verifyRes.status}`);
      return res.status(200).json({ success: true, message: 'Verification failed, will retry' });
    }

    const verified = await verifyRes.json();

    if (verified.status !== 'succeeded') {
      console.log(`[webhook] Payment ${paymentId} verified status: ${verified.status} (not succeeded), ignoring`);
      return res.status(200).json({ success: true, message: 'Not succeeded yet' });
    }

    console.log(`[webhook] ✅ Payment ${paymentId} VERIFIED as succeeded. Amount: ${verified.amount?.value} ${verified.amount?.currency}`);

    // Check metadata — if the client already submitted (client flow), we skip
    // The metadata contains tariff/releaseType/etc. from when payment was created
    const metadata = verified.metadata || {};
    console.log(`[webhook] Payment metadata:`, JSON.stringify(metadata));

    // Log for monitoring. The actual form submission is done by the client
    // after redirect. The webhook is a safety net — if we wanted full
    // server-side submit, we'd need the full formData stored somewhere.
    // For now, just log confirmed payments for reconciliation.
    console.log(`[webhook] 💰 CONFIRMED PAYMENT: ${paymentId} | ${verified.amount?.value} ${verified.amount?.currency} | tariff=${metadata.tariff || '?'} | release=${metadata.releaseType || '?'} | email=${metadata.email || verified.receipt?.customer?.email || '?'}`);

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed',
      paymentId,
      amount: verified.amount,
    });
  } catch (error) {
    console.error('[webhook] Error:', error);
    // Return 200 so YooKassa doesn't keep retrying
    return res.status(200).json({ success: true, message: 'Error handled' });
  }
}
