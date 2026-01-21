import { supabaseAdmin } from "./supabase-admin";

export type SubscriptionStatus = "active" | "paused" | "cancelled" | "past_due" | "pending";

export type Subscription = {
  id: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  userName?: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  billingDay: number; // Day of month (1-28) when billing occurs
  nextBillingDate: string;
  lastBillingDate?: string;
  profile?: any; // Shipping address
  // Payment tracking
  currentPaymentIntentId?: string;
  lastPaymentStatus?: string;
};

export type SubscriptionPayment = {
  id: string;
  subscriptionId: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  paymentIntentId?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
};

function generateSubscriptionId(): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `SUB-${now}-${rand}`.toUpperCase();
}

function generatePaymentId(): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `PAY-${now}-${rand}`.toUpperCase();
}

function mapRowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name ?? undefined,
    productId: row.product_id,
    productSlug: row.product_slug,
    productTitle: row.product_title,
    status: row.status,
    amount: Number(row.amount ?? 0),
    currency: row.currency || "AED",
    billingDay: row.billing_day,
    nextBillingDate: row.next_billing_date,
    lastBillingDate: row.last_billing_date ?? undefined,
    profile: row.profile ?? undefined,
    currentPaymentIntentId: row.current_payment_intent_id ?? undefined,
    lastPaymentStatus: row.last_payment_status ?? undefined,
  };
}

function mapRowToPayment(row: any): SubscriptionPayment {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    createdAt: row.created_at,
    amount: Number(row.amount ?? 0),
    currency: row.currency || "AED",
    status: row.status,
    paymentIntentId: row.payment_intent_id ?? undefined,
    billingPeriodStart: row.billing_period_start,
    billingPeriodEnd: row.billing_period_end,
  };
}

export async function createSubscription(
  input: Omit<Subscription, "id" | "createdAt" | "status" | "nextBillingDate" | "billingDay">
): Promise<Subscription> {
  const id = generateSubscriptionId();
  const createdAt = new Date().toISOString();
  const today = new Date();
  const billingDay = today.getDate() > 28 ? 28 : today.getDate(); // Cap at 28 to avoid month-end issues
  
  // Calculate next billing date (1 month from now, on the same day)
  const nextBilling = new Date(today);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  nextBilling.setDate(billingDay);
  const nextBillingDate = nextBilling.toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      id,
      created_at: createdAt,
      user_id: input.userId,
      user_email: input.userEmail,
      user_name: input.userName ?? null,
      product_id: input.productId,
      product_slug: input.productSlug,
      product_title: input.productTitle,
      status: "pending", // Will be set to active after first payment
      amount: input.amount,
      currency: input.currency,
      billing_day: billingDay,
      next_billing_date: nextBillingDate,
      profile: input.profile ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create subscription:", error);
    throw new Error("Failed to create subscription");
  }

  return mapRowToSubscription(data);
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToSubscription(data);
}

export async function getSubscriptionByPaymentIntent(
  paymentIntentId: string
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("current_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToSubscription(data);
}

export async function getUserSubscriptions(userEmail: string): Promise<Subscription[]> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapRowToSubscription);
}

export async function getUserActiveSubscription(
  userEmail: string,
  productSlug: string
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_email", userEmail)
    .eq("product_slug", productSlug)
    .in("status", ["active", "pending"])
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToSubscription(data);
}

export async function updateSubscriptionStatus(
  id: string,
  status: SubscriptionStatus
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToSubscription(data);
}

export async function setSubscriptionPaymentIntent(
  id: string,
  paymentIntentId: string
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({ current_payment_intent_id: paymentIntentId })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToSubscription(data);
}

export async function activateSubscription(
  id: string,
  paymentStatus: string
): Promise<Subscription | null> {
  const today = new Date();
  const subscription = await getSubscription(id);
  if (!subscription) return null;

  // Calculate next billing date
  const nextBilling = new Date(today);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  nextBilling.setDate(subscription.billingDay);
  const nextBillingDate = nextBilling.toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      last_payment_status: paymentStatus,
      last_billing_date: today.toISOString().split("T")[0],
      next_billing_date: nextBillingDate,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToSubscription(data);
}

export async function getSubscriptionsDueBilling(): Promise<Subscription[]> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .lte("next_billing_date", today);

  if (error || !data) return [];
  return data.map(mapRowToSubscription);
}

export async function listAllSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapRowToSubscription);
}

// Subscription Payments

export async function createSubscriptionPayment(
  subscriptionId: string,
  amount: number,
  currency: string,
  billingPeriodStart: string,
  billingPeriodEnd: string
): Promise<SubscriptionPayment> {
  const id = generatePaymentId();
  const createdAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscription_payments")
    .insert({
      id,
      subscription_id: subscriptionId,
      created_at: createdAt,
      amount,
      currency,
      status: "pending",
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create subscription payment:", error);
    throw new Error("Failed to create subscription payment");
  }

  return mapRowToPayment(data);
}

export async function updateSubscriptionPayment(
  id: string,
  updates: Partial<Pick<SubscriptionPayment, "status" | "paymentIntentId">>
): Promise<SubscriptionPayment | null> {
  const updateData: Record<string, any> = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.paymentIntentId) updateData.payment_intent_id = updates.paymentIntentId;

  const { data, error } = await supabaseAdmin
    .from("subscription_payments")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToPayment(data);
}

export async function getSubscriptionPayments(
  subscriptionId: string
): Promise<SubscriptionPayment[]> {
  const { data, error } = await supabaseAdmin
    .from("subscription_payments")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapRowToPayment);
}
