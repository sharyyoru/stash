import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { cancelSubscription, getSubscription } from "../../../../lib/stripe";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const CANCELLATION_DAYS_BEFORE = 5;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.subscriptionId) {
    return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
  }

  const { subscriptionId, cancelImmediately = false } = body;

  try {
    // Get subscription from our database to verify ownership
    const { data: dbSubscription, error: dbError } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (dbError || !dbSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Verify the subscription belongs to this user
    if (dbSubscription.user_email !== session.user.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get the Stripe subscription to check billing period
    const stripeSubscription = await getSubscription(subscriptionId) as any;
    
    if (!stripeSubscription) {
      return NextResponse.json({ error: "Stripe subscription not found" }, { status: 404 });
    }

    // Check the 5-day rule
    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    const now = new Date();
    const daysUntilRenewal = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilRenewal < CANCELLATION_DAYS_BEFORE && !cancelImmediately) {
      return NextResponse.json({
        error: "cancellation_too_late",
        message: `Cancellations must be made at least ${CANCELLATION_DAYS_BEFORE} days before your next billing date.`,
        details: {
          daysUntilRenewal,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          minimumDaysRequired: CANCELLATION_DAYS_BEFORE,
        },
      }, { status: 400 });
    }

    // Cancel the subscription at period end (not immediately)
    const cancelledSubscription = await cancelSubscription(subscriptionId, false);

    // Update our database
    await supabaseAdmin
      .from("secret_stash_subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    return NextResponse.json({
      success: true,
      message: "Subscription will be cancelled at the end of your current billing period",
      cancelAt: currentPeriodEnd.toISOString(),
      subscription: {
        id: subscriptionId,
        status: (cancelledSubscription as any).status,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Subscription cancellation error:", error);

    if (error.message?.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cancel subscription", details: error.message },
      { status: 500 }
    );
  }
}
