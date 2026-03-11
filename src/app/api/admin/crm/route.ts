import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

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

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const hasSubscription = searchParams.get("hasSubscription") || "all";
    const hasOrders = searchParams.get("hasOrders") || "all";
    const hasAddress = searchParams.get("hasAddress") || "all";

    const offset = (page - 1) * limit;

    // Get all profiles
    let query = supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,mobile.ilike.%${search}%`);
    }

    const { data: profiles, error: profilesError, count: profilesCount } = await query;

    if (profilesError) throw profilesError;

    // Get subscription counts for each user
    const userEmails = (profiles || []).map(p => p.email);
    const { data: subscriptions } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("user_email, status")
      .in("user_email", userEmails);

    const subscriptionCounts = new Map();
    (subscriptions || []).forEach(sub => {
      const current = subscriptionCounts.get(sub.user_email) || { total: 0, active: 0 };
      subscriptionCounts.set(sub.user_email, {
        total: current.total + 1,
        active: current.active + (sub.status === "active" ? 1 : 0),
      });
    });

    // Get order counts for each user
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("customer_email, status, total_amount")
      .in("customer_email", userEmails);

    const orderCounts = new Map();
    const totalSpent = new Map();
    (orders || []).forEach(order => {
      const current = orderCounts.get(order.customer_email) || 0;
      orderCounts.set(order.customer_email, current + 1);
      
      const spent = totalSpent.get(order.customer_email) || 0;
      totalSpent.set(order.customer_email, spent + (order.total_amount || 0));
    });

    // Combine and filter data
    let users = (profiles || []).map(profile => {
      const subs = subscriptionCounts.get(profile.email) || { total: 0, active: 0 };
      const orders = orderCounts.get(profile.email) || 0;
      const spent = totalSpent.get(profile.email) || 0;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        mobile: profile.mobile,
        address: profile.address,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_login: profile.last_login,
        subscription_count: subs.total,
        active_subscriptions: subs.active,
        order_count: orders,
        total_spent: spent,
      };
    });

    // Apply additional filters
    if (hasSubscription !== "all") {
      users = users.filter(user => 
        hasSubscription === "yes" ? user.subscription_count > 0 : user.subscription_count === 0
      );
    }

    if (hasOrders !== "all") {
      users = users.filter(user => 
        hasOrders === "yes" ? user.order_count > 0 : user.order_count === 0
      );
    }

    if (hasAddress !== "all") {
      users = users.filter(user => 
        hasAddress === "yes" ? !!user.address : !user.address
      );
    }

    // Apply pagination after filtering
    const filteredStart = offset;
    const filteredEnd = offset + limit - 1;
    const paginatedUsers = users.slice(filteredStart, filteredEnd + 1);
    const filteredTotal = users.length;

    return NextResponse.json({
      users: paginatedUsers,
      page,
      limit,
      total: filteredTotal,
      totalPages: Math.ceil(filteredTotal / limit),
    });

  } catch (error: any) {
    console.error("[CRM] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
