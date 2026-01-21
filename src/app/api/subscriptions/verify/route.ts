import { NextRequest, NextResponse } from "next/server";
import {
  getSubscription,
  activateSubscription,
  updateSubscriptionStatus,
} from "../../../../lib/subscriptions-store";
import { getPaymentIntent } from "../../../../lib/ziina";

/**
 * Verify payment status for a subscription
 * Called when user returns from Ziina payment page
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId, paymentIntentId } = body;

    if (!subscriptionId || !paymentIntentId) {
      return NextResponse.json(
        { error: "Missing subscriptionId or paymentIntentId" },
        { status: 400 }
      );
    }

    // Get the subscription
    const subscription = await getSubscription(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Verify the payment intent ID matches
    if (subscription.currentPaymentIntentId !== paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent mismatch" },
        { status: 400 }
      );
    }

    // Check payment status with Ziina
    const paymentIntent = await getPaymentIntent(paymentIntentId);

    let updatedSubscription = subscription;

    switch (paymentIntent.status) {
      case "completed":
        // Activate the subscription
        updatedSubscription = (await activateSubscription(subscriptionId, paymentIntent.status)) || subscription;
        break;
      case "failed":
      case "canceled":
        // Cancel the subscription
        updatedSubscription = (await updateSubscriptionStatus(subscriptionId, "cancelled")) || subscription;
        break;
      default:
        // Still pending
        break;
    }

    return NextResponse.json({
      subscription: updatedSubscription,
      paymentStatus: paymentIntent.status,
      success: paymentIntent.status === "completed",
    });
  } catch (error: any) {
    console.error("Subscription verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription payment", details: error.message },
      { status: 500 }
    );
  }
}
