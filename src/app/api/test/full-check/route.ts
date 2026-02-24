import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { getStripe } from "../../../../lib/stripe";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
  }

  try {
    console.log("[Full Check] Starting comprehensive check for:", email);

    // 1. Check database records
    const { data: dbSubs, error: dbError } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    // 2. Check Stripe API
    const stripe = getStripe();
    const customers = await stripe.customers.list({ email, limit: 10 });
    const customer = customers.data[0];

    let stripeSubs: any[] = [];
    if (customer) {
      const subs = await stripe.subscriptions.list({ customer: customer.id });
      stripeSubs = subs.data.map((s: any) => ({
        id: s.id,
        status: s.status,
        current_period_start: new Date(s.current_period_start * 1000).toISOString(),
        current_period_end: new Date(s.current_period_end * 1000).toISOString(),
        items: s.items.data.map((item: any) => ({
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
            recurring: item.price.recurring,
          }
        }))
      }));
    }

    // 3. Check environment variables
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
    };

    // 4. Test webhook endpoint URL
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/stripe`;

    return NextResponse.json({
      email,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      webhook_url: webhookUrl,
      database: {
        subscriptions: dbSubs || [],
        error: dbError?.message,
        count: dbSubs?.length || 0,
      },
      stripe_api: {
        customer: customer ? {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        } : null,
        subscriptions: stripeSubs,
        count: stripeSubs.length,
      },
      analysis: {
        has_db_records: (dbSubs?.length || 0) > 0,
        has_stripe_records: stripeSubs.length > 0,
        records_match: dbSubs && dbSubs.length > 0 && stripeSubs.length > 0,
        webhook_configured: !!(process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_SECRET_KEY),
      }
    });
  } catch (error: any) {
    console.error("[Full Check] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
