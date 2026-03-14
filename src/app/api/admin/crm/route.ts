import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Helper to detect schema cache / missing table errors
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || "";
  return msg.includes("schema cache") || 
         (msg.includes("relation") && msg.includes("does not exist")) ||
         (msg.includes("table") && msg.includes("does not exist"));
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
      .order("created_at", { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,mobile.ilike.%${search}%`);
    }

    const { data: allProfiles, error: profilesError, count: profilesCount } = await query;

    // Handle missing profiles table - continue with empty profiles
    if (profilesError && isTableMissingError(profilesError)) {
      console.warn("[CRM] Profiles table not found - continuing with orders/subscriptions only");
    } else if (profilesError) {
      throw profilesError;
    }

    console.log("[CRM Debug] Total profiles found:", allProfiles?.length || 0);
    console.log("[CRM Debug] Sample profiles:", allProfiles?.slice(0, 3));
    console.log("[CRM Debug] Search term:", search);
    console.log("[CRM Debug] Filters:", { hasSubscription, hasOrders, hasAddress });

    // Get ALL users - combine profiles and orders
    const profileEmails = (allProfiles || []).map(p => p.email);
    
    // Get all orders to find buyers who might not have profiles
    const { data: allOrders } = await supabaseAdmin
      .from("orders")
      .select("customer_email, status, total_amount, created_at");
    
    // Get all subscriptions
    const { data: allSubscriptions } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("user_email, status, created_at");

    // Combine all unique emails from profiles, orders, and subscriptions
    const allUserEmails = new Set([
      ...profileEmails,
      ...(allOrders || []).map(o => o.customer_email),
      ...(allSubscriptions || []).map(s => s.user_email),
    ]);

    console.log("[CRM Debug] All unique user emails:", allUserEmails.size);
    console.log("[CRM Debug] Sources:", {
      profiles: profileEmails.length,
      orders: allOrders?.length || 0,
      subscriptions: allSubscriptions?.length || 0,
    });

    // Get subscription counts
    const subscriptionCounts = new Map();
    (allSubscriptions || []).forEach(sub => {
      const current = subscriptionCounts.get(sub.user_email) || { total: 0, active: 0 };
      subscriptionCounts.set(sub.user_email, {
        total: current.total + 1,
        active: current.active + (sub.status === "active" ? 1 : 0),
      });
    });

    // Get order counts and total spent
    const orderCounts = new Map();
    const totalSpent = new Map();
    (allOrders || []).forEach(order => {
      const current = orderCounts.get(order.customer_email) || 0;
      orderCounts.set(order.customer_email, current + 1);
      
      const spent = totalSpent.get(order.customer_email) || 0;
      totalSpent.set(order.customer_email, spent + (order.total_amount || 0));
    });

    // Create user objects for ALL users (profiles + orders-only users)
    let allUsers: any[] = [];

    // Add users with profiles
    (allProfiles || []).forEach(profile => {
      const subs = subscriptionCounts.get(profile.email) || { total: 0, active: 0 };
      const orders = orderCounts.get(profile.email) || 0;
      const spent = totalSpent.get(profile.email) || 0;

      allUsers.push({
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
        has_profile: true,
      });
    });

    // Add users from orders who don't have profiles
    const profileEmailSet = new Set(profileEmails);
    (allOrders || []).forEach(order => {
      if (!profileEmailSet.has(order.customer_email)) {
        const subs = subscriptionCounts.get(order.customer_email) || { total: 0, active: 0 };
        const orders = orderCounts.get(order.customer_email) || 0;
        const spent = totalSpent.get(order.customer_email) || 0;

        // Check if we already added this user
        const existingUser = allUsers.find(u => u.email === order.customer_email);
        if (!existingUser) {
          allUsers.push({
            id: `order-${order.customer_email}`,
            email: order.customer_email,
            name: null,
            mobile: null,
            address: null,
            created_at: order.created_at,
            updated_at: null,
            last_login: null,
            subscription_count: subs.total,
            active_subscriptions: subs.active,
            order_count: orders,
            total_spent: spent,
            has_profile: false,
          });
        }
      }
    });

    console.log("[CRM Debug] Total combined users:", allUsers.length);

    // Apply search filter
    let filteredUsers = allUsers;
    if (search) {
      filteredUsers = allUsers.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.mobile?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply additional filters
    if (hasSubscription !== "all") {
      filteredUsers = filteredUsers.filter(user => 
        hasSubscription === "yes" ? user.subscription_count > 0 : user.subscription_count === 0
      );
    }

    if (hasOrders !== "all") {
      filteredUsers = filteredUsers.filter(user => 
        hasOrders === "yes" ? user.order_count > 0 : user.order_count === 0
      );
    }

    if (hasAddress !== "all") {
      filteredUsers = filteredUsers.filter(user => 
        hasAddress === "yes" ? !!user.address : !user.address
      );
    }

    console.log("[CRM Debug] Final filtered users:", filteredUsers.length);

    // Apply pagination after filtering
    const filteredStart = offset;
    const filteredEnd = offset + limit - 1;
    const paginatedUsers = filteredUsers.slice(filteredStart, filteredEnd + 1);
    const filteredTotal = filteredUsers.length;

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
