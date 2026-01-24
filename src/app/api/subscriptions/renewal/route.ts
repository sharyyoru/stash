import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  getSubscription,
  getSubscriptionsNeedingRenewal,
  markRenewalReminderSent,
  setSubscriptionPaymentIntent,
} from "../../../../lib/subscriptions-store";
import { createPaymentIntent, toBaseUnits } from "../../../../lib/ziina";
import { notifySubscriptionRenewal } from "../../../../lib/email";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

// POST - Send renewal reminder to a specific subscription
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.subscriptionId) {
    return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  }

  try {
    const subscription = await getSubscription(body.subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (subscription.status !== "active") {
      return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
    }

    // Calculate days until expiry
    const today = new Date();
    const nextBilling = new Date(subscription.nextBillingDate);
    const daysUntilExpiry = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Create payment intent for renewal
    const baseUrl = process.env.NEXTAUTH_URL || "https://s-tash.store";
    const successUrl = `${baseUrl}/subscription/renewal-success?subscription_id=${subscription.id}&payment_intent_id={PAYMENT_INTENT_ID}`;
    const cancelUrl = `${baseUrl}/subscription/renewal-cancel?subscription_id=${subscription.id}`;
    const failureUrl = `${baseUrl}/subscription/renewal-failed?subscription_id=${subscription.id}`;

    const message = `Renewal: ${subscription.productTitle} - ${subscription.currency} ${subscription.amount.toFixed(2)}/month`.slice(0, 80);

    const paymentIntent = await createPaymentIntent({
      amount: toBaseUnits(subscription.amount),
      currencyCode: subscription.currency,
      message,
      successUrl,
      cancelUrl,
      failureUrl,
    });

    // Store the payment intent ID
    await setSubscriptionPaymentIntent(subscription.id, paymentIntent.id);

    // Send renewal email with payment link
    await notifySubscriptionRenewal({
      subscriptionId: subscription.id,
      customerName: subscription.userName,
      customerEmail: subscription.userEmail,
      productTitle: subscription.productTitle,
      amount: subscription.amount,
      currency: subscription.currency,
      renewalDate: subscription.nextBillingDate,
      paymentLink: paymentIntent.redirect_url,
      daysUntilExpiry,
    });

    // Mark reminder as sent
    await markRenewalReminderSent(subscription.id);

    return NextResponse.json({
      success: true,
      paymentLink: paymentIntent.redirect_url,
      message: "Renewal reminder sent successfully",
    });
  } catch (error: any) {
    console.error("Failed to send renewal reminder:", error);
    return NextResponse.json({ error: error.message || "Failed to send renewal reminder" }, { status: 500 });
  }
}

// GET - Get subscriptions needing renewal
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const daysAhead = parseInt(searchParams.get("days") || "3", 10);

  try {
    const subscriptions = await getSubscriptionsNeedingRenewal(daysAhead);
    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("Failed to get subscriptions needing renewal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
