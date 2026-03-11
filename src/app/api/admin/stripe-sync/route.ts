import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { getStripe } from "../../../../lib/stripe";
import Stripe from "stripe";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

async function determineTierName(price: Stripe.Price): Promise<string> {
  const interval = price.recurring?.interval || "month";
  const intervalCount = price.recurring?.interval_count || 1;
  const amount = (price.unit_amount || 0) / 100;
  
  // Try to determine tier by price and interval
  if (interval === "year" || (interval === "month" && intervalCount === 12)) {
    return "Yearly Subscription";
  } else if (interval === "month" && intervalCount === 6) {
    return "6 months Subscription";
  } else if (interval === "month" && intervalCount === 3) {
    return "3 months Subscription";
  } else if (interval === "month" && intervalCount === 1) {
    return "1 month Subscription";
  }
  
  // Fallback to amount-based detection
  if (amount >= 500) return "Yearly Subscription";
  if (amount >= 250) return "6 months Subscription";
  if (amount >= 120) return "3 months Subscription";
  
  return "Monthly Subscription";
}

async function syncSubscription(subscription: Stripe.Subscription, customer: Stripe.Customer): Promise<{ success: boolean; error?: string; synced?: any }> {
  try {
    const sub = subscription as any; // Cast to any for access to non-typed properties
    const priceItem = subscription.items?.data?.[0];
    if (!priceItem?.price) {
      return { success: false, error: "No price item found" };
    }

    const interval = priceItem.price.recurring?.interval || "month";
    const intervalCount = priceItem.price.recurring?.interval_count || 1;
    const amount = (priceItem.price.unit_amount || 0) / 100;
    const tierName = await determineTierName(priceItem.price);

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
      current_period_start: new Date((sub.current_period_start || 0) * 1000).toISOString(),
      current_period_end: new Date((sub.current_period_end || 0) * 1000).toISOString(),
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

      if (error) {
        console.error("[Sync] Failed to update subscription:", error);
        return { success: false, error: error.message };
      }
      
      console.log("[Sync] Updated existing subscription:", subscription.id);
      return { success: true, synced: { ...subscriptionData, action: "updated" } };
    } else {
      // Insert new
      const { error } = await supabaseAdmin
        .from("secret_stash_subscriptions")
        .insert(subscriptionData);

      if (error) {
        console.error("[Sync] Failed to insert subscription:", error);
        return { success: false, error: error.message };
      }
      
      console.log("[Sync] Inserted new subscription:", subscription.id);
      return { success: true, synced: { ...subscriptionData, action: "inserted" } };
    }
  } catch (error: any) {
    console.error("[Sync] Error processing subscription:", error);
    return { success: false, error: error.message };
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Stripe Sync] Starting full Stripe subscription sync");

    const stripe = getStripe();
    const results = {
      total: 0,
      synced: 0,
      updated: 0,
      inserted: 0,
      errors: 0,
      details: [] as any[],
    };

    // Get all active subscriptions from Stripe
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const subscriptions = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.customer", "data.items.data.price"],
      });

      console.log(`[Stripe Sync] Processing batch of ${subscriptions.data.length} subscriptions`);

      for (const subscription of subscriptions.data) {
        results.total++;
        
        const customer = subscription.customer as Stripe.Customer;
        if (!customer.email) {
          console.warn("[Sync] Skipping subscription without customer email:", subscription.id);
          continue;
        }

        const syncResult = await syncSubscription(subscription, customer);
        
        if (syncResult.success) {
          results.synced++;
          if (syncResult.synced?.action === "updated") {
            results.updated++;
          } else if (syncResult.synced?.action === "inserted") {
            results.inserted++;
          }
          results.details.push({
            subscriptionId: subscription.id,
            email: customer.email,
            action: syncResult.synced?.action,
            status: "success",
          });
        } else {
          results.errors++;
          results.details.push({
            subscriptionId: subscription.id,
            email: customer.email || "unknown",
            status: "error",
            error: syncResult.error,
          });
        }
      }

      hasMore = subscriptions.has_more;
      startingAfter = subscriptions.data.length > 0 ? subscriptions.data[subscriptions.data.length - 1].id : undefined;
    }

    console.log("[Stripe Sync] Completed:", results);

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${results.synced}/${results.total} subscriptions processed`,
      results,
    });

  } catch (error: any) {
    console.error("[Stripe Sync] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    
    // Get comparison data
    const { data: dbSubs } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ["data.customer", "data.items.data.price"],
    });

    const comparison = {
      database: {
        count: dbSubs?.length || 0,
        active: dbSubs?.filter(s => s.status === "active").length || 0,
        latest: dbSubs?.slice(0, 5) || [],
      },
      stripe: {
        count: stripeSubscriptions.data.length,
        active: stripeSubscriptions.data.filter(s => s.status === "active").length,
        latest: stripeSubscriptions.data.slice(0, 5).map(s => ({
          id: s.id,
          status: s.status,
          customer: (s.customer as Stripe.Customer)?.email,
          created: new Date(s.created * 1000).toISOString(),
        })),
      },
      missing: [] as string[],
      extra: [] as string[],
    };

    // Find missing subscriptions (in Stripe but not in DB)
    const dbIds = new Set(dbSubs?.map(s => s.id) || []);
    const stripeIds = new Set(stripeSubscriptions.data.map(s => s.id));
    
    comparison.missing = Array.from(stripeIds).filter(id => !dbIds.has(id));
    comparison.extra = Array.from(dbIds).filter(id => !stripeIds.has(id));

    return NextResponse.json({
      success: true,
      comparison,
    });

  } catch (error: any) {
    console.error("[Stripe Sync] Comparison error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
