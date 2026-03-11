import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { supabaseAdmin } from "../../lib/supabase-admin";
import AdminDashboardClient from "./admin-dashboard-client";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

async function getDashboardStats() {
  try {
    // Get orders stats
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_amount, created_at")
      .order("created_at", { ascending: false });

    const ordersStats = {
      total: orders?.length || 0,
      pending: orders?.filter(o => o.status === "payment-pending").length || 0,
      paid: orders?.filter(o => o.status === "paid").length || 0,
      processing: orders?.filter(o => o.status === "processing").length || 0,
      inTransit: orders?.filter(o => o.status === "in-transit").length || 0,
      delivered: orders?.filter(o => o.status === "delivered").length || 0,
      cancelled: orders?.filter(o => o.status === "cancelled").length || 0,
      totalRevenue: orders?.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    };

    // Get subscription stats
    const { data: subscriptions } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("id, status, amount, billing_interval, created_at, user_email")
      .order("created_at", { ascending: false });

    const activeSubscriptions = subscriptions?.filter(s => s.status === "active") || [];
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

    const subscriptionsStats = {
      total: subscriptions?.length || 0,
      active: activeSubscriptions.length,
      cancelled: subscriptions?.filter(s => s.status === "cancelled").length || 0,
      pastDue: subscriptions?.filter(s => s.status === "past_due").length || 0,
      monthlyRevenue,
      yearlyRevenue,
    };

    // Get recent activity
    const recentOrders = orders?.slice(0, 5).map(o => ({
      id: o.id,
      type: "order" as const,
      status: o.status,
      amount: o.total_amount,
      date: o.created_at,
    })) || [];

    const recentSubscriptions = subscriptions?.slice(0, 5).map(s => ({
      id: s.id,
      type: "subscription" as const,
      status: s.status,
      amount: s.amount,
      date: s.created_at,
      email: s.user_email,
    })) || [];

    const recentActivity = [...recentOrders, ...recentSubscriptions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      orders: ordersStats,
      subscriptions: subscriptionsStats,
      recentActivity,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return {
      orders: {
        total: 0,
        pending: 0,
        paid: 0,
        processing: 0,
        inTransit: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
      },
      subscriptions: {
        total: 0,
        active: 0,
        cancelled: 0,
        pastDue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
      },
      recentActivity: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/sign-in");
  }

  const dashboardData = await getDashboardStats();

  return <AdminDashboardClient data={dashboardData} />;
}
