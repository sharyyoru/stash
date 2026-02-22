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
    // Check secret_stash_subscriptions table
    const { data: stripeSubs, error: stripeError } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    // Check old subscriptions table
    const { data: oldSubs, error: oldError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    // Check payments table
    const { data: payments, error: paymentError } = await supabaseAdmin
      .from("secret_stash_payments")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    // Get Stripe customer info
    const stripe = getStripe();
    const customers = await stripe.customers.list({ email, limit: 10 });
    const customer = customers.data[0];

    // Get Stripe subscriptions for this customer
    let stripeSubscriptions: any[] = [];
    if (customer) {
      const subs = await stripe.subscriptions.list({ customer: customer.id });
      stripeSubscriptions = subs.data.map((s: any) => ({
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

    return NextResponse.json({
      email,
      database: {
        stripe_subscriptions: stripeSubs || [],
        stripe_error: stripeError?.message,
        old_subscriptions: oldSubs || [],
        old_error: oldError?.message,
        payments: payments || [],
        payment_error: paymentError?.message,
      },
      stripe_api: {
        customer: customer ? {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        } : null,
        subscriptions: stripeSubscriptions,
      }
    });
  } catch (error: any) {
    console.error("Webhook debug error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
