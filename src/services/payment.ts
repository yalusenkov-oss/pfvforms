// Payment service — ЮKassa integration
// Creates payments via our server API and handles payment flow

export interface CreatePaymentParams {
  amount: number;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  success: boolean;
  paymentId?: string;
  confirmationUrl?: string;
  error?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  paymentId?: string;
  status?: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid?: boolean;
  error?: string;
}

const API_BASE = '';

/**
 * Create a new payment via ЮKassa.
 * Returns a confirmation URL to redirect the user to.
 */
export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amount,
        description: params.description || 'Оплата дистрибуции PFVMUSIC',
        metadata: params.metadata || {},
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      paymentId: json.paymentId,
      confirmationUrl: json.confirmationUrl,
    };
  } catch (err) {
    console.error('[payment] createPayment error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ошибка создания платежа',
    };
  }
}

/**
 * Check payment status by ID.
 */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/status?paymentId=${encodeURIComponent(paymentId)}`);
    const json = await res.json();

    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      paymentId: json.paymentId,
      status: json.status,
      paid: json.paid,
    };
  } catch (err) {
    console.error('[payment] checkPaymentStatus error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ошибка проверки платежа',
    };
  }
}

/**
 * Poll payment status until it reaches a final state.
 * Returns when status is 'succeeded' or 'canceled', or after timeout.
 */
export async function waitForPayment(
  paymentId: string,
  options?: { intervalMs?: number; timeoutMs?: number }
): Promise<PaymentStatusResult> {
  const interval = options?.intervalMs || 3000;
  const timeout = options?.timeoutMs || 300_000; // 5 minutes
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const result = await checkPaymentStatus(paymentId);

    if (!result.success) return result;
    if (result.status === 'succeeded' || result.status === 'canceled') {
      return result;
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  return {
    success: false,
    paymentId,
    error: 'Тайм-аут проверки статуса оплаты',
  };
}
