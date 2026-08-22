import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  createSubscription,
  setSubscriptionPaymentIntent,
  getUserActiveSubscription,
} from "../../../../lib/subscriptions-store";
import { createPaymentIntent, toBaseUnits } from "../../../../lib/ziina";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.productId || !body.productSlug || !body.productTitle || typeof body.amount !== "number") {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  const {
    productId,
    productSlug,
    productTitle,
    amount,
    currency = "AED",
    profile,
  } = body;

  try {
    // Check if user already has an active subscription for this product
    const existingSubscription = await getUserActiveSubscription(
      session.user.email!,
      productSlug
    );

    if (existingSubscription) {
      return NextResponse.json(
        { error: "You already have an active subscription for this product" },
        { status: 400 }
      );
    }

    // 1. Create the subscription in our database
    const subscription = await createSubscription({
      userId: session.user.email!,
      userEmail: session.user.email!,
      userName: session.user.name || undefined,
      productId,
      productSlug,
      productTitle,
      amount,
      currency,
      profile,
    });

    // 2. Build redirect URLs
    const baseUrl = process.env.NEXTAUTH_URL || "";
    const successUrl = `${baseUrl}/subscription/success?subscription_id=${subscription.id}&payment_intent_id={PAYMENT_INTENT_ID}`;
    const cancelUrl = `${baseUrl}/subscription/cancel?subscription_id=${subscription.id}`;
    const failureUrl = `${baseUrl}/subscription/failed?subscription_id=${subscription.id}`;

    // 3. Create Ziina payment intent for the first month
    const message = `Subscription: ${productTitle} - ${currency} ${amount.toFixed(2)}/month`.slice(0, 80);

    const paymentIntent = await createPaymentIntent({
      amount: toBaseUnits(amount),
      currencyCode: currency,
      message,
      successUrl,
      cancelUrl,
      failureUrl,
    });

    // 4. Store the payment intent ID on the subscription
    await setSubscriptionPaymentIntent(subscription.id, paymentIntent.id);

    // 5. Return the redirect URL for the client
    return NextResponse.json({
      subscription,
      paymentIntentId: paymentIntent.id,
      redirectUrl: paymentIntent.redirect_url,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Subscription checkout error:", error);
    
    if (error.message?.includes("ZIINA_API_TOKEN")) {
      return NextResponse.json({
        error: "Payment gateway not configured. Please contact support.",
        details: error.message,
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: "Failed to create subscription",
      details: error.message,
    }, { status: 500 });
  }
}
