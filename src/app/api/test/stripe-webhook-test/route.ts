import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
    }

    console.log("[Test] Checking Stripe subscriptions for:", email);

    // Get Stripe customer
    const stripe = getStripe();
    const customers = await stripe.customers.list({ email, limit: 10 });
    
    if (customers.data.length === 0) {
      return NextResponse.json({ error: "No Stripe customer found for this email" }, { status: 404 });
    }

    const customer = customers.data[0];
    console.log("[Test] Found customer:", customer.id);

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "No active subscriptions found" }, { status: 404 });
    }

    const subscription = subscriptions.data[0] as any;
    console.log("[Test] Found subscription:", subscription.id);

    // Simulate webhook processing
    const priceItem = subscription.items?.data?.[0];
    const interval = priceItem?.price?.recurring?.interval || "month";
    const intervalCount = priceItem?.price?.recurring?.interval_count || 1;
    const amount = (priceItem?.price?.unit_amount || 0) / 100;
    
    // Determine tier name
    let tierName = "Monthly Subscription";
    if (interval === "year" || (interval === "month" && intervalCount === 12)) {
      tierName = "Yearly Subscription";
    } else if (interval === "month" && intervalCount === 3) {
      tierName = "3 months Subscription";
    } else if (interval === "month" && intervalCount === 1) {
      tierName = "1 month Subscription";
    }

    const subscriptionData = {
      id: subscription.id,
      stripe_customer_id: customer.id,
      user_email: email,
      user_name: customer.name,
      tier_id: null,
      tier_name: tierName,
      status: subscription.status,
      amount: amount,
      billing_interval: interval,
      billing_interval_count: intervalCount,
      current_period_start: subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString() 
        : new Date().toISOString(),
      current_period_end: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("[Test] Storing subscription:", subscriptionData);

    // Cancel old subscriptions first
    await supabaseAdmin
      .from("secret_stash_subscriptions")
      .update({ 
        status: "superseded",
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", email)
      .neq("id", subscription.id)
      .in("status", ["active", "trialing"]);

    // Store new subscription
    const { error } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .upsert(subscriptionData, { onConflict: "id" });

    if (error) {
      console.error("[Test] Failed to store subscription:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[Test] Successfully stored subscription");

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
      message: "Subscription manually synced from Stripe"
    });

  } catch (error: any) {
    console.error("[Test] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
