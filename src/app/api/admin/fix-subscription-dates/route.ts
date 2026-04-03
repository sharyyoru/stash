import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import Stripe from "stripe";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(apiKey);
}

/**
 * Fix subscription dates that are incorrectly set to 1970-01-01
 * This happens when the Stripe webhook doesn't properly parse the timestamps
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();
    
    // Get all subscriptions from our database
    const { data: dbSubscriptions, error: dbError } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*");

    if (dbError) {
      return NextResponse.json({ error: "Failed to fetch subscriptions", details: dbError.message }, { status: 500 });
    }

    const results: any[] = [];
    const epochDate = new Date(0).toISOString().split('T')[0]; // "1970-01-01"

    for (const dbSub of dbSubscriptions || []) {
      const periodStart = dbSub.current_period_start?.split('T')[0];
      const periodEnd = dbSub.current_period_end?.split('T')[0];
      
      // Check if dates are epoch (1970-01-01) or missing
      const needsFix = !periodStart || !periodEnd || 
                       periodStart === epochDate || 
                       periodEnd === epochDate ||
                       new Date(dbSub.current_period_start).getFullYear() < 2020 ||
                       new Date(dbSub.current_period_end).getFullYear() < 2020;

      if (needsFix) {
        try {
          // Fetch fresh data from Stripe
          const stripeSub = await stripe.subscriptions.retrieve(dbSub.id) as any;
          
          if (stripeSub && stripeSub.current_period_start && stripeSub.current_period_end) {
            const newPeriodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
            const newPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

            // Update in database
            const { error: updateError } = await supabaseAdmin
              .from("secret_stash_subscriptions")
              .update({
                current_period_start: newPeriodStart,
                current_period_end: newPeriodEnd,
                updated_at: new Date().toISOString(),
              })
              .eq("id", dbSub.id);

            if (updateError) {
              results.push({
                id: dbSub.id,
                status: "error",
                error: updateError.message,
              });
            } else {
              results.push({
                id: dbSub.id,
                status: "fixed",
                oldStart: dbSub.current_period_start,
                oldEnd: dbSub.current_period_end,
                newStart: newPeriodStart,
                newEnd: newPeriodEnd,
              });
            }
          } else {
            results.push({
              id: dbSub.id,
              status: "skipped",
              reason: "Stripe subscription not found or missing period data",
            });
          }
        } catch (stripeError: any) {
          results.push({
            id: dbSub.id,
            status: "error",
            error: stripeError.message,
          });
        }
      } else {
        results.push({
          id: dbSub.id,
          status: "ok",
          periodStart,
          periodEnd,
        });
      }
    }

    const fixed = results.filter(r => r.status === "fixed").length;
    const errors = results.filter(r => r.status === "error").length;
    const ok = results.filter(r => r.status === "ok").length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        fixed,
        errors,
        alreadyOk: ok,
      },
      results,
    });
  } catch (error: any) {
    console.error("[Fix Dates] Error:", error);
    return NextResponse.json({ error: "Failed to fix dates", details: error.message }, { status: 500 });
  }
}
