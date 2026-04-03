import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getStripe } from "../../../lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    console.log("[Emergency Sync] Starting immediate Stripe subscription sync");

    const stripe = getStripe();
    let syncedCount = 0;
    let errorCount = 0;

    // Get all subscriptions from Stripe (not just active)
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ["data.customer", "data.items.data.price"],
    });

    console.log(`[Emergency Sync] Found ${subscriptions.data.length} total subscriptions`);

    for (const subscription of subscriptions.data) {
      try {
        const customer = subscription.customer as Stripe.Customer;
        if (!customer.email) {
          console.warn("[Emergency Sync] Skipping subscription without customer email:", subscription.id);
          errorCount++;
          continue;
        }

        const priceItem = subscription.items?.data?.[0];
        if (!priceItem?.price) {
          console.warn("[Emergency Sync] Skipping subscription without price:", subscription.id);
          errorCount++;
          continue;
        }

        // Determine tier name
        const interval = priceItem.price.recurring?.interval || "month";
        const intervalCount = priceItem.price.recurring?.interval_count || 1;
        const amount = (priceItem.price.unit_amount || 0) / 100;
        
        let tierName = "Monthly Subscription";
        if (interval === "year" || (interval === "month" && intervalCount === 12)) {
          tierName = "Yearly Subscription";
        } else if (interval === "month" && intervalCount === 6) {
          tierName = "6 months Subscription";
        } else if (interval === "month" && intervalCount === 3) {
          tierName = "3 months Subscription";
        } else if (interval === "month" && intervalCount === 1) {
          tierName = "1 month Subscription";
        }

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
            .update(subscriptionData)
            .eq("id", subscription.id);

          if (error) {
            console.error("[Emergency Sync] Failed to update:", subscription.id, error);
            errorCount++;
          } else {
            console.log("[Emergency Sync] Updated:", subscription.id);
            syncedCount++;
          }
        } else {
          // Insert new
          const { error } = await supabaseAdmin
            .from("secret_stash_subscriptions")
            .insert(subscriptionData);

          if (error) {
            console.error("[Emergency Sync] Failed to insert:", subscription.id, error);
            errorCount++;
          } else {
            console.log("[Emergency Sync] Inserted:", subscription.id);
            syncedCount++;
          }
        }
      } catch (error: any) {
        console.error("[Emergency Sync] Error processing subscription:", subscription.id, error);
        errorCount++;
      }
    }

    console.log(`[Emergency Sync] Completed: ${syncedCount} synced, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Emergency sync completed: ${syncedCount} subscriptions synced, ${errorCount} errors`,
      syncedCount,
      errorCount,
      totalFound: subscriptions.data.length,
    });

  } catch (error: any) {
    console.error("[Emergency Sync] Fatal error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
