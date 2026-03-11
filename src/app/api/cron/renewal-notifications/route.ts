import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { sendRenewalReminderEmail } from "../../../../lib/email-notifications";

// This endpoint should be called by a cron job daily
export async function GET(req: NextRequest) {
  try {
    console.log("[Renewal Notifications] Starting daily renewal check");

    // Get active subscriptions that renew in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysFromNowISO = sevenDaysFromNow.toISOString().slice(0, 10);

    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);

    const { data: upcomingRenewals, error } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .eq("status", "active")
      .gte("current_period_end", todayISO)
      .lte("current_period_end", sevenDaysFromNowISO)
      .order("current_period_end", { ascending: true });

    if (error) {
      console.error("[Renewal Notifications] Error fetching renewals:", error);
      throw error;
    }

    console.log(`[Renewal Notifications] Found ${upcomingRenewals?.length || 0} upcoming renewals`);

    let emailsSent = 0;
    let errors = 0;

    for (const subscription of upcomingRenewals || []) {
      try {
        const renewalDate = new Date(subscription.current_period_end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const success = await sendRenewalReminderEmail(
          subscription.user_email,
          subscription.user_name || "friend",
          renewalDate,
          subscription.tier_name || "Subscription"
        );

        if (success) {
          emailsSent++;
          console.log(`[Renewal Notifications] Sent reminder to: ${subscription.user_email}`);
        } else {
          errors++;
        }
      } catch (err) {
        console.error(`[Renewal Notifications] Failed to send to ${subscription.user_email}:`, err);
        errors++;
      }
    }

    console.log(`[Renewal Notifications] Completed: ${emailsSent} emails sent, ${errors} errors`);

    return NextResponse.json({
      success: true,
      checked: new Date().toISOString(),
      upcomingRenewals: upcomingRenewals?.length || 0,
      emailsSent,
      errors,
    });

  } catch (error: any) {
    console.error("[Renewal Notifications] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
