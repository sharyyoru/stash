import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getStripe } from "../../../lib/stripe";
import Stripe from "stripe";

async function determineTierName(price: Stripe.Price): Promise<string> {
  const interval = price.recurring?.interval || "month";
  const intervalCount = price.recurring?.interval_count || 1;
  const amount = (price.unit_amount || 0) / 100;
  
  if (interval === "year" || (interval === "month" && intervalCount === 12)) {
    return "Yearly Subscription";
  } else if (interval === "month" && intervalCount === 6) {
    return "6 months Subscription";
  } else if (interval === "month" && intervalCount === 3) {
    return "3 months Subscription";
  } else if (interval === "month" && intervalCount === 1) {
    return "1 month Subscription";
  }
  
  if (amount >= 500) return "Yearly Subscription";
  if (amount >= 250) return "6 months Subscription";
  if (amount >= 120) return "3 months Subscription";
  
  return "Monthly Subscription";
}

export async function POST(req: NextRequest) {
  try {
    console.log("[Sync Now] Starting immediate Stripe sync");

    const stripe = getStripe();
    let syncedCount = 0;
    let errorCount = 0;
    const results = [];

    // Get all active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.customer", "data.items.data.price"],
    });

    console.log(`[Sync Now] Found ${subscriptions.data.length} active subscriptions`);

    for (const subscription of subscriptions.data) {
      try {
        const customer = subscription.customer as Stripe.Customer;
        if (!customer.email) {
          console.warn("[Sync Now] Skipping subscription without customer email:", subscription.id);
          continue;
        }

        const priceItem = subscription.items?.data?.[0];
        if (!priceItem?.price) {
          console.warn("[Sync Now] Skipping subscription without price:", subscription.id);
          continue;
        }

        const interval = priceItem.price.recurring?.interval || "month";
        const intervalCount = priceItem.price.recurring?.interval_count || 1;
        const amount = (priceItem.price.unit_amount || 0) / 100;
        const tierName = await determineTierName(priceItem.price);

        const sub = subscription as any; // Cast for access to properties
        const subscriptionData = {
          id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          user_email: customer.email,
          user_name: customer.name,
          tier_id: null,
          tier_name: tierName,
          status: subscription.status,
          amount: amount,
          billing_interval: interval,
          billing_interval_count: intervalCount,
          current_period_start: sub.current_period_start 
            ? new Date(sub.current_period_start * 1000).toISOString() 
            : new Date().toISOString(),
          current_period_end: sub.current_period_end 
            ? new Date(sub.current_period_end * 1000).toISOString() 
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          created_at: new Date(subscription.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from("secret_stash_subscriptions")
          .select("id")
          .eq("id", subscription.id)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabaseAdmin
            .from("secret_stash_subscriptions")
            .update({
              ...subscriptionData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          if (error) throw error;
          console.log("[Sync Now] Updated:", subscription.id);
          results.push({ id: subscription.id, email: customer.email, action: "updated" });
        } else {
          // Insert new
          const { error } = await supabaseAdmin
            .from("secret_stash_subscriptions")
            .insert(subscriptionData);

          if (error) throw error;
          console.log("[Sync Now] Inserted:", subscription.id);
          results.push({ id: subscription.id, email: customer.email, action: "inserted" });
        }

        syncedCount++;
      } catch (error: any) {
        console.error("[Sync Now] Error processing subscription:", subscription.id, error);
        errorCount++;
        results.push({ id: subscription.id, error: error.message });
      }
    }

    console.log(`[Sync Now] Completed: ${syncedCount} synced, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} subscriptions`,
      syncedCount,
      errorCount,
      results,
    });

  } catch (error: any) {
    console.error("[Sync Now] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
