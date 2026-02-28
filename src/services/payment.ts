// Payment service — ЮKassa integration
// Creates payments via our server API and handles payment flow

export interface CreatePaymentParams {
  amount: number;
  description?: string;
  metadata?: Record<string, string>;
  email?: string;
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
  cancellationDetails?: { party?: string; reason?: string } | null;
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
        email: params.email || '',
      }),
    });

    const text = await res.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok || !json?.success) {
      return {
        success: false,
        error: json?.error || `HTTP ${res.status}${text ? `: ${text.slice(0, 160)}` : ''}`,
      };
    }

    return {
      success: true,
      paymentId: json?.paymentId,
      confirmationUrl: json?.confirmationUrl,
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
    const text = await res.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok || !json?.success) {
      return {
        success: false,
        error: json?.error || `HTTP ${res.status}${text ? `: ${text.slice(0, 160)}` : ''}`,
      };
    }

    return {
      success: true,
      paymentId: json?.paymentId,
      status: json?.status,
      paid: json?.paid,
      cancellationDetails: json?.cancellationDetails || null,
    };
  } catch (err) {
    console.error('[payment] checkPaymentStatus error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ошибка проверки платежа',
    };
  }
}
