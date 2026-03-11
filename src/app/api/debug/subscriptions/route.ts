import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { getStripe } from "../../../../lib/stripe";

export async function GET(req: NextRequest) {
  try {
    console.log("[Debug] Checking subscription data");

    // 1. Check database
    const { data: dbSubs, error: dbError } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("[Debug] Database subscriptions:", dbSubs?.length || 0);

    // 2. Check Stripe
    const stripe = getStripe();
    const stripeSubs = await stripe.subscriptions.list({
      limit: 10,
      expand: ["data.customer", "data.items.data.price"],
    });

    console.log("[Debug] Stripe subscriptions:", stripeSubs.data.length);

    // 3. Check environment
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // 4. Sample Stripe data
    const sampleStripeSub = stripeSubs.data[0];
    const sampleData = sampleStripeSub ? {
      id: sampleStripeSub.id,
      status: sampleStripeSub.status,
      customer: (sampleStripeSub.customer as any)?.email,
      created: new Date(sampleStripeSub.created * 1000).toISOString(),
      current_period_start: new Date((sampleStripeSub as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((sampleStripeSub as any).current_period_end * 1000).toISOString(),
      price: sampleStripeSub.items.data[0]?.price,
    } : null;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        count: dbSubs?.length || 0,
        error: dbError?.message,
        sample: dbSubs?.[0] || null,
      },
      stripe: {
        count: stripeSubs.data.length,
        sample: sampleData,
      },
      analysis: {
        hasDataInStripe: stripeSubs.data.length > 0,
        hasDataInDatabase: (dbSubs?.length || 0) > 0,
        needsSync: stripeSubs.data.length > 0 && (dbSubs?.length || 0) === 0,
      }
    });

  } catch (error: any) {
    console.error("[Debug] Error:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
