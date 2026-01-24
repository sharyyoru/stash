"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SubscriptionStatus = "active" | "paused" | "cancelled" | "past_due" | "pending";

type Subscription = {
  id: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  userName?: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  billingDay: number;
  nextBillingDate: string;
  lastBillingDate?: string;
  profile?: any;
  currentPaymentIntentId?: string;
  lastPaymentStatus?: string;
  renewalReminderSent?: boolean;
  lastRenewalReminderDate?: string;
};

type SubscriptionDelivery = {
  id: string;
  subscriptionId: string;
  createdAt: string;
  billingMonth: string;
  deliveryStatus: "pending" | "shipped" | "delivered";
  deliveredAt?: string;
  notes?: string;
  awbNumber?: string;
};

type SubscriptionPayment = {
  id: string;
  subscriptionId: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  paymentIntentId?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
};

const statusColors: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  paused: "bg-amber-100 text-amber-800 border-amber-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  past_due: "bg-orange-100 text-orange-800 border-orange-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200",
};

const deliveryStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysUntilRenewal(nextBillingDate: string): number {
  const today = new Date();
  const next = new Date(nextBillingDate);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function AdminSubscriptionsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubscriptionStatus>("all");
  const [renewalFilter, setRenewalFilter] = useState<"all" | "due-soon" | "overdue">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "renewal-soon" | "amount-high" | "amount-low">("newest");
  
  // Expanded subscription details
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<{
    payments: SubscriptionPayment[];
    deliveries: SubscriptionDelivery[];
  } | null>(null);
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  
  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user?.email) {
      router.push("/sign-in");
      return;
    }
    fetchSubscriptions();
  }, [session, sessionStatus, router]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions/manage");
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpandedData = async (subscriptionId: string) => {
    if (expandedId === subscriptionId) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    
    setExpandedId(subscriptionId);
    setLoadingExpanded(true);
    
    try {
      const res = await fetch(`/api/subscriptions/manage?id=${subscriptionId}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setExpandedData({
        payments: data.payments || [],
        deliveries: data.deliveries || [],
      });
    } catch (err) {
      setExpandedData({ payments: [], deliveries: [] });
    } finally {
      setLoadingExpanded(false);
    }
  };

  const sendRenewalReminder = async (subscriptionId: string) => {
    setActionLoading(subscriptionId);
    setActionMessage(null);
    
    try {
      const res = await fetch("/api/subscriptions/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send reminder");
      
      setActionMessage({ type: "success", text: "Renewal reminder sent!" });
      fetchSubscriptions(); // Refresh to update reminder status
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: SubscriptionStatus) => {
    setActionLoading(subscriptionId);
    
    try {
      const res = await fetch("/api/subscriptions/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subscriptionId, status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      setActionMessage({ type: "success", text: "Status updated!" });
      fetchSubscriptions();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const createDeliveryRecord = async (subscriptionId: string) => {
    const billingMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    setActionLoading(subscriptionId);
    
    try {
      const res = await fetch("/api/subscriptions/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, billingMonth }),
      });
      
      if (!res.ok) throw new Error("Failed to create delivery");
      
      setActionMessage({ type: "success", text: "Delivery record created!" });
      if (expandedId === subscriptionId) {
        fetchExpandedData(subscriptionId);
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string, subscriptionId: string) => {
    setActionLoading(deliveryId);
    
    try {
      const updates: any = { id: deliveryId, deliveryStatus: newStatus };
      if (newStatus === "delivered") {
        updates.deliveredAt = new Date().toISOString();
      }
      
      const res = await fetch("/api/subscriptions/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) throw new Error("Failed to update delivery");
      
      setActionMessage({ type: "success", text: "Delivery updated!" });
      fetchExpandedData(subscriptionId);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered and sorted subscriptions
  const filteredSubscriptions = useMemo(() => {
    let result = [...subscriptions];
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.userEmail.toLowerCase().includes(q) ||
          (s.userName?.toLowerCase().includes(q) ?? false) ||
          s.productTitle.toLowerCase().includes(q)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    
    // Renewal filter
    if (renewalFilter !== "all") {
      result = result.filter((s) => {
        const days = getDaysUntilRenewal(s.nextBillingDate);
        if (renewalFilter === "overdue") return days < 0;
        if (renewalFilter === "due-soon") return days >= 0 && days <= 7;
        return true;
      });
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "renewal-soon":
          return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return result;
  }, [subscriptions, searchQuery, statusFilter, renewalFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === "active").length;
    const paused = subscriptions.filter((s) => s.status === "paused").length;
    const cancelled = subscriptions.filter((s) => s.status === "cancelled").length;
    const dueSoon = subscriptions.filter((s) => {
      const days = getDaysUntilRenewal(s.nextBillingDate);
      return s.status === "active" && days >= 0 && days <= 7;
    }).length;
    const monthlyRevenue = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.amount, 0);
    
    return { active, paused, cancelled, dueSoon, monthlyRevenue };
  }, [subscriptions]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-48"></div>
            <div className="h-32 bg-neutral-200 rounded"></div>
            <div className="h-64 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-800">Error: {error}</p>
            <button
              onClick={fetchSubscriptions}
              className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Admin
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              Subscription Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Orders
            </Link>
            <Link
              href="/admin/deliveries"
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 shadow-sm hover:bg-blue-100"
            >
              <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
              </svg>
              Deliveries
            </Link>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div
            className={`rounded-xl p-3 text-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {actionMessage.text}
            <button
              onClick={() => setActionMessage(null)}
              className="ml-2 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Paused</p>
            <p className="text-2xl font-bold text-amber-600">{stats.paused}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Renewals Due</p>
            <p className="text-2xl font-bold text-orange-600">{stats.dueSoon}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-4 shadow-sm ring-1 ring-amber-200">
            <p className="text-xs text-amber-700 uppercase tracking-wide">Monthly Revenue</p>
            <p className="text-2xl font-bold text-amber-800">
              AED {stats.monthlyRevenue.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by ID, email, name, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
              <option value="pending">Pending</option>
            </select>

            {/* Renewal Filter */}
            <select
              value={renewalFilter}
              onChange={(e) => setRenewalFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              <option value="all">All Renewals</option>
              <option value="due-soon">Due Soon (7 days)</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="renewal-soon">Renewal Soon</option>
              <option value="amount-high">Amount (High)</option>
              <option value="amount-low">Amount (Low)</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
            </span>
            <button
              onClick={fetchSubscriptions}
              className="inline-flex items-center text-amber-600 hover:text-amber-700"
            >
              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Subscriptions List */}
        {filteredSubscriptions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-100 text-center">
            <p className="text-neutral-500">No subscriptions found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubscriptions.map((sub) => {
              const daysUntilRenewal = getDaysUntilRenewal(sub.nextBillingDate);
              const isExpanded = expandedId === sub.id;
              const isOverdue = daysUntilRenewal < 0;
              const isDueSoon = daysUntilRenewal >= 0 && daysUntilRenewal <= 7;

              return (
                <div
                  key={sub.id}
                  className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100 overflow-hidden"
                >
                  {/* Main Row */}
                  <div className="p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Left: ID & Customer */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-neutral-500">
                            {sub.id}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              statusColors[sub.status]
                            }`}
                          >
                            {sub.status.toUpperCase()}
                          </span>
                          {sub.renewalReminderSent && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-semibold">
                              REMINDER SENT
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-neutral-900">
                          {sub.userName || sub.userEmail}
                        </p>
                        <p className="text-xs text-neutral-500">{sub.userEmail}</p>
                      </div>

                      {/* Center: Product & Amount */}
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-900">{sub.productTitle}</p>
                        <p className="text-lg font-bold text-amber-600">
                          {sub.currency} {sub.amount}
                          <span className="text-xs font-normal text-neutral-500">/month</span>
                        </p>
                      </div>

                      {/* Right: Renewal Info */}
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Next Renewal</p>
                        <p className="text-sm font-medium text-neutral-900">
                          {formatDate(sub.nextBillingDate)}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            isOverdue
                              ? "text-red-600"
                              : isDueSoon
                              ? "text-orange-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntilRenewal)} days overdue`
                            : daysUntilRenewal === 0
                            ? "Due today"
                            : `${daysUntilRenewal} days left`}
                        </p>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => fetchExpandedData(sub.id)}
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                          isExpanded
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                        <svg
                          className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {sub.status === "active" && (
                        <button
                          onClick={() => sendRenewalReminder(sub.id)}
                          disabled={actionLoading === sub.id}
                          className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                        >
                          {actionLoading === sub.id ? (
                            "Sending..."
                          ) : (
                            <>
                              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Send Renewal Email
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => createDeliveryRecord(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1.5 text-[11px] font-medium text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                      >
                        <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Create Delivery
                      </button>

                      <select
                        value={sub.status}
                        onChange={(e) => updateSubscriptionStatus(sub.id, e.target.value as SubscriptionStatus)}
                        disabled={actionLoading === sub.id}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="past_due">Past Due</option>
                      </select>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 bg-neutral-50 p-4 space-y-4">
                      {loadingExpanded ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                        </div>
                      ) : (
                        <>
                          {/* Subscription Details */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-100">
                              <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                                Subscription Details
                              </h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-neutral-500">Created</dt>
                                  <dd className="font-medium">{formatDateTime(sub.createdAt)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-neutral-500">Billing Day</dt>
                                  <dd className="font-medium">
                                    {sub.billingDay}{getOrdinalSuffix(sub.billingDay)} of each month
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-neutral-500">Last Billing</dt>
                                  <dd className="font-medium">{formatDate(sub.lastBillingDate || "")}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-neutral-500">Last Payment</dt>
                                  <dd className="font-medium">{sub.lastPaymentStatus || "—"}</dd>
                                </div>
                              </dl>
                            </div>

                            <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-100">
                              <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                                Customer Profile
                              </h4>
                              {sub.profile ? (
                                <dl className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <dt className="text-neutral-500">Mobile</dt>
                                    <dd className="font-medium">{sub.profile.mobile || "—"}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-neutral-500">Address</dt>
                                    <dd className="font-medium text-right max-w-[200px]">
                                      {sub.profile.address || "—"}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-neutral-500">City</dt>
                                    <dd className="font-medium">{sub.profile.city || "—"}</dd>
                                  </div>
                                </dl>
                              ) : (
                                <p className="text-sm text-neutral-500">No profile data</p>
                              )}
                            </div>
                          </div>

                          {/* Deliveries */}
                          <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-100">
                            <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                              Delivery History
                            </h4>
                            {expandedData?.deliveries && expandedData.deliveries.length > 0 ? (
                              <div className="space-y-2">
                                {expandedData.deliveries.map((del) => (
                                  <div
                                    key={del.id}
                                    className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-50 rounded-lg"
                                  >
                                    <div>
                                      <span className="text-sm font-medium">{del.billingMonth}</span>
                                      <span
                                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          deliveryStatusColors[del.deliveryStatus]
                                        }`}
                                      >
                                        {del.deliveryStatus.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {del.awbNumber && (
                                        <span className="text-xs text-neutral-500">
                                          AWB: {del.awbNumber}
                                        </span>
                                      )}
                                      <select
                                        value={del.deliveryStatus}
                                        onChange={(e) =>
                                          updateDeliveryStatus(del.id, e.target.value, sub.id)
                                        }
                                        disabled={actionLoading === del.id}
                                        className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium focus:outline-none"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">No deliveries recorded</p>
                            )}
                          </div>

                          {/* Payments */}
                          <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-100">
                            <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                              Payment History
                            </h4>
                            {expandedData?.payments && expandedData.payments.length > 0 ? (
                              <div className="space-y-2">
                                {expandedData.payments.map((pay) => (
                                  <div
                                    key={pay.id}
                                    className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-50 rounded-lg"
                                  >
                                    <div>
                                      <span className="text-sm font-medium">
                                        {pay.currency} {pay.amount.toFixed(2)}
                                      </span>
                                      <span
                                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          pay.status === "paid"
                                            ? "bg-green-100 text-green-800"
                                            : pay.status === "failed"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }`}
                                      >
                                        {pay.status.toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-xs text-neutral-500">
                                      {formatDate(pay.createdAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">No payments recorded</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
