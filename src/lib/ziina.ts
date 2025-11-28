/**
 * Ziina Payment Gateway Integration
 * Documentation: https://docs.ziina.com/api-reference/payment-intent
 */

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

export type PaymentIntentStatus =
  | "requires_payment_instrument"
  | "pending"
  | "requires_user_action"
  | "completed"
  | "failed"
  | "canceled";

export type PaymentIntent = {
  id: string;
  account_id: string;
  amount: number;
  tip_amount?: number;
  fee_amount?: number;
  currency_code: string;
  created_at: string;
  status: PaymentIntentStatus;
  operation_id?: string;
  message?: string;
  redirect_url: string;
  success_url: string;
  cancel_url: string;
  latest_error?: {
    message: string;
    code: string;
  };
  allow_tips?: boolean;
};

export type CreatePaymentIntentParams = {
  /** Amount in base units (e.g., 1050 = 10.50 AED) */
  amount: number;
  /** 3-letter ISO-4217 currency code (e.g., "AED") */
  currencyCode: string;
  /** Message displayed on the payment page */
  message?: string;
  /** URL to redirect on successful payment */
  successUrl: string;
  /** URL to redirect if payment is cancelled */
  cancelUrl: string;
  /** URL to redirect on payment failure */
  failureUrl?: string;
  /** Whether to allow tips */
  allowTips?: boolean;
};

function getApiToken(): string {
  const token = process.env.ZIINA_API_TOKEN;
  if (!token || token === "your_ziina_api_token_here") {
    throw new Error("ZIINA_API_TOKEN environment variable is not configured");
  }
  return token;
}

function isTestMode(): boolean {
  return process.env.ZIINA_TEST_MODE === "true";
}

/**
 * Create a new Payment Intent with Ziina
 * The user should be redirected to the returned redirect_url to complete payment
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntent> {
  const token = getApiToken();
  const testMode = isTestMode();

  const response = await fetch(`${ZIINA_API_BASE}/payment_intent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency_code: params.currencyCode,
      message: params.message,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      failure_url: params.failureUrl,
      test: testMode,
      allow_tips: params.allowTips ?? false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `Ziina API error: ${response.status} - ${errorData?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get a Payment Intent by ID to check its status
 */
export async function getPaymentIntent(id: string): Promise<PaymentIntent> {
  const token = getApiToken();

  const response = await fetch(`${ZIINA_API_BASE}/payment_intent/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `Ziina API error: ${response.status} - ${errorData?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Convert a display amount (e.g., 10.50) to base units (e.g., 1050)
 */
export function toBaseUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert base units (e.g., 1050) to display amount (e.g., 10.50)
 */
export function fromBaseUnits(amount: number): number {
  return amount / 100;
}
