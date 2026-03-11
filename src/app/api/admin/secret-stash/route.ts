import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { sendPackageSentEmail } from "../../../../lib/email-notifications";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "stats") {
      // Get month-on-month stats
      const { data: subscriptions } = await supabaseAdmin
        .from("secret_stash_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: deliveries } = await supabaseAdmin
        .from("secret_stash_deliveries")
        .select("*")
        .order("month", { ascending: false });

      const { data: payments } = await supabaseAdmin
        .from("secret_stash_payments")
        .select("*")
        .order("created_at", { ascending: false });

      // Calculate monthly stats
      const monthlyStats: Record<string, any> = {};
      
      (subscriptions || []).forEach((sub) => {
        const month = sub.created_at?.slice(0, 7) || "unknown";
        if (!monthlyStats[month]) {
          monthlyStats[month] = { newSubscriptions: 0, revenue: 0, lettersSent: 0, totalActive: 0 };
        }
        monthlyStats[month].newSubscriptions++;
      });

      (payments || []).forEach((payment) => {
        if (payment.status === "paid") {
          const month = payment.created_at?.slice(0, 7) || "unknown";
          if (!monthlyStats[month]) {
            monthlyStats[month] = { newSubscriptions: 0, revenue: 0, lettersSent: 0, totalActive: 0 };
          }
          monthlyStats[month].revenue += payment.amount || 0;
        }
      });

      (deliveries || []).forEach((del) => {
        const month = del.month || "unknown";
        if (!monthlyStats[month]) {
          monthlyStats[month] = { newSubscriptions: 0, revenue: 0, lettersSent: 0, totalActive: 0 };
        }
        if (del.status === "sent" || del.status === "delivered") {
          monthlyStats[month].lettersSent++;
        }
      });

      return NextResponse.json({ stats: monthlyStats });
    }

    // Default: Get all subscriptions with user profiles and delivery status
    const { data: subscriptions, error } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get user profiles for delivery addresses
    const userEmails = [...new Set((subscriptions || []).map((s) => s.user_email).filter(Boolean))];
    
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("email", userEmails);

    const profileMap = new Map((profiles || []).map((p) => [p.email, p]));

    // Debug: Log profile data to check addresses
    console.log("[Admin Debug] Profiles found:", profiles?.length || 0);
    console.log("[Admin Debug] Sample profile:", profiles?.[0]);
    console.log("[Admin Debug] Subscription sample:", subscriptions?.[0]);

    // Get current month's delivery status for each subscription
    const deliveryMonth = new Date().toISOString().slice(0, 7);
    const { data: deliveries } = await supabaseAdmin
      .from("secret_stash_deliveries")
      .select("*")
      .eq("month", deliveryMonth);

    const deliveryMap = new Map((deliveries || []).map((d) => [d.subscription_id, d]));

    // Combine data
    const enrichedSubscriptions = (subscriptions || []).map((sub) => ({
      ...sub,
      profile: profileMap.get(sub.user_email) || null,
      currentMonthDelivery: deliveryMap.get(sub.id) || null,
    }));

    // Calculate summary stats
    const activeSubscriptions = subscriptions?.filter((s) => s.status === "active") || [];
    const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
      if (sub.billing_interval === "year") {
        return sum + ((sub.amount || 0) / 12);
      }
      return sum + (sub.amount || 0);
    }, 0);
    
    const yearlyRevenue = activeSubscriptions.reduce((sum, sub) => {
      if (sub.billing_interval === "month") {
        return sum + ((sub.amount || 0) * 12);
      }
      return sum + (sub.amount || 0);
    }, 0);

    // Calculate renewals this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const renewalsThisMonth = activeSubscriptions.filter(sub => {
      const renewalMonth = new Date(sub.current_period_end).toISOString().slice(0, 7);
      return renewalMonth === currentMonth;
    }).length;

    const stats = {
      total: subscriptions?.length || 0,
      active: activeSubscriptions.length,
      cancelled: subscriptions?.filter((s) => s.status === "cancelled").length || 0,
      pastDue: subscriptions?.filter((s) => s.status === "past_due").length || 0,
      pendingLetters: enrichedSubscriptions.filter(
        (s) => s.status === "active" && !s.currentMonthDelivery?.status
      ).length,
      sentLetters: deliveries?.filter((d) => d.status === "sent" || d.status === "delivered").length || 0,
      monthlyRevenue,
      yearlyRevenue,
      renewalsThisMonth,
    };

    return NextResponse.json({ subscriptions: enrichedSubscriptions, stats });
  } catch (error: any) {
    console.error("Admin Secret Stash API error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, subscriptionId, month, status, notes, trackingNumber } = body;

  try {
    if (action === "mark_letter") {
      // Mark letter as sent/pending for a subscription
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      
      // Check if delivery record exists
      const { data: existing } = await supabaseAdmin
        .from("secret_stash_deliveries")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .eq("month", targetMonth)
        .single();

      if (existing) {
        // Update existing
        const updateData: any = {
          status: status || "sent",
          notes: notes || existing.notes,
          tracking_number: trackingNumber || existing.tracking_number,
          updated_at: new Date().toISOString(),
        };
        
        if (status === "sent" && !existing.sent_at) {
          updateData.sent_at = new Date().toISOString();
        }
        
        if (status === "delivered" && !existing.delivered_at) {
          updateData.delivered_at = new Date().toISOString();
        }

        const { error } = await supabaseAdmin
          .from("secret_stash_deliveries")
          .update(updateData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabaseAdmin.from("secret_stash_deliveries").insert({
          subscription_id: subscriptionId,
          month: targetMonth,
          status: status || "sent",
          sent_at: status === "sent" ? new Date().toISOString() : null,
          delivered_at: status === "delivered" ? new Date().toISOString() : null,
          notes: notes || null,
          tracking_number: trackingNumber || null,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Send email notification to subscriber if marked as sent
      if (status === "sent") {
        try {
          // Get subscription details for email
          const { data: subscription } = await supabaseAdmin
            .from("secret_stash_subscriptions")
            .select("*")
            .eq("id", subscriptionId)
            .single();

          if (subscription && subscription.user_email) {
            const monthName = new Date(targetMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" });
            await sendPackageSentEmail(
              subscription.user_email,
              subscription.user_name || "friend",
              trackingNumber,
              monthName
            );
            console.log("[Admin] Package sent email sent to:", subscription.user_email);
          }
        } catch (emailError) {
          console.error("[Admin] Failed to send package sent email:", emailError);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "bulk_mark") {
      // Bulk mark letters as sent
      const { subscriptionIds } = body;
      const targetMonth = month || new Date().toISOString().slice(0, 7);

      for (const subId of subscriptionIds || []) {
        const { data: existing } = await supabaseAdmin
          .from("secret_stash_deliveries")
          .select("id")
          .eq("subscription_id", subId)
          .eq("month", targetMonth)
          .single();

        if (existing) {
          await supabaseAdmin
            .from("secret_stash_deliveries")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabaseAdmin.from("secret_stash_deliveries").insert({
            subscription_id: subId,
            month: targetMonth,
            status: "sent",
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      }

      return NextResponse.json({ success: true, count: subscriptionIds?.length || 0 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Secret Stash API error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
