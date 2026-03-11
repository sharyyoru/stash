"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing" | "incomplete" | "superseded";

type DeliveryStatus = "pending" | "sent" | "delivered";

type Profile = {
  email: string;
  name?: string;
  mobile?: string;
  address_line1?: string;
  address_line2?: string;
  building?: string;
  area?: string;
  city?: string;
  emirate?: string;
  landmark?: string;
};

type CurrentMonthDelivery = {
  id: string;
  subscription_id: string;
  month: string;
  status: DeliveryStatus;
  sent_at?: string;
  tracking_number?: string;
  notes?: string;
  delivered_at?: string;
};

type SecretStashSubscription = {
  id: string;
  stripe_customer_id: string;
  user_email: string;
  user_name?: string;
  tier_id?: string;
  tier_name?: string;
  status: SubscriptionStatus;
  amount?: number;
  billing_interval?: string;
  billing_interval_count?: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string;
  profile?: Profile | null;
  currentMonthDelivery?: CurrentMonthDelivery | null;
};

type Stats = {
  total: number;
  active: number;
  cancelled: number;
  pastDue: number;
  pendingLetters: number;
  sentLetters: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  renewalsThisMonth: number;
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  past_due: "bg-orange-100 text-orange-800 border-orange-200",
  trialing: "bg-blue-100 text-blue-800 border-blue-200",
  incomplete: "bg-yellow-100 text-yellow-800 border-yellow-200",
  superseded: "bg-gray-100 text-gray-800 border-gray-200",
};

const deliveryStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
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

function formatMonth(monthStr: string): string {
  if (!monthStr) return "—";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-AE", { year: "numeric", month: "long" });
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function getMonthOptions(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export default function AdminSubscribersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<SecretStashSubscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubscriptionStatus>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "pending" | "sent" | "delivered">("all");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created" | "name" | "email" | "status" | "renewal">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Tracking and notes state
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});

  // Monthly report view
  const [showReport, setShowReport] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<Record<string, any>>({});

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
      const res = await fetch("/api/admin/secret-stash");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch subscriptions");
      }
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const res = await fetch("/api/admin/secret-stash?action=stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setMonthlyStats(data.stats || {});
      setShowReport(true);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const markDeliveryStatus = async (subscriptionId: string, status: DeliveryStatus, trackingNumber?: string, notes?: string) => {
    setActionLoading(subscriptionId);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/secret-stash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_letter",
          subscriptionId,
          month: selectedMonth,
          status,
          trackingNumber,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setActionMessage({ type: "success", text: `Package marked as ${status}!` });
      fetchSubscriptions();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const bulkMarkSent = async () => {
    if (selectedIds.size === 0) return;

    setActionLoading("bulk");
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/secret-stash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_mark",
          subscriptionIds: Array.from(selectedIds),
          month: selectedMonth,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      const data = await res.json();
      setActionMessage({ type: "success", text: `${data.count} packages marked as sent!` });
      setSelectedIds(new Set());
      fetchSubscriptions();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID", "Email", "Name", "Tier", "Status", "Amount", "Billing Interval",
      "Created", "Period Start", "Period End", "Mobile", "Address", "Area", "City",
      `${formatMonth(selectedMonth)} Delivery Status`, "Tracking #", "Notes"
    ];
    
    const rows = filteredSubscriptions.map(sub => [
      sub.id,
      sub.user_email,
      sub.user_name || "",
      sub.tier_name || "",
      sub.status,
      sub.amount ? `AED ${sub.amount}` : "",
      sub.billing_interval || "",
      formatDate(sub.created_at),
      formatDate(sub.current_period_start),
      formatDate(sub.current_period_end),
      sub.profile?.mobile || "",
      sub.profile?.address_line1 || "",
      sub.profile?.area || "",
      sub.profile?.city || "",
      sub.currentMonthDelivery?.status || (sub.status === "active" ? "pending" : "—"),
      sub.currentMonthDelivery?.tracking_number || "",
      sub.currentMonthDelivery?.notes || ""
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAllPending = () => {
    const pendingIds = filteredSubscriptions
      .filter((s) => s.status === "active" && (!s.currentMonthDelivery?.status || s.currentMonthDelivery?.status === "pending"))
      .map((s) => s.id);
    setSelectedIds(new Set(pendingIds));
  };

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    let result = [...subscriptions];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.user_email.toLowerCase().includes(q) ||
          (s.user_name?.toLowerCase().includes(q) ?? false) ||
          (s.tier_name?.toLowerCase().includes(q) ?? false) ||
          (s.profile?.mobile?.includes(q) ?? false)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Tier filter
    if (tierFilter !== "all") {
      result = result.filter((s) => s.tier_name === tierFilter);
    }

    // Delivery status filter
    if (deliveryFilter !== "all") {
      result = result.filter((s) => {
        const deliveryStatus = s.currentMonthDelivery?.status;
        if (deliveryFilter === "pending") {
          return s.status === "active" && (!deliveryStatus || deliveryStatus === "pending");
        }
        if (deliveryFilter === "sent") {
          return deliveryStatus === "sent";
        }
        if (deliveryFilter === "delivered") {
          return deliveryStatus === "delivered";
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.user_name || "";
          bValue = b.user_name || "";
          break;
        case "email":
          aValue = a.user_email;
          bValue = b.user_email;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "renewal":
          aValue = new Date(a.current_period_end).getTime();
          bValue = new Date(b.current_period_end).getTime();
          break;
        case "created":
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [subscriptions, searchQuery, statusFilter, deliveryFilter, tierFilter, sortBy, sortOrder]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-64"></div>
            <div className="h-32 bg-neutral-200 rounded"></div>
            <div className="h-96 bg-neutral-200 rounded"></div>
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
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-600">
              Admin
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              Secret Stash Subscribers
            </h1>
            {stats && (
              <p className="text-xs text-neutral-500 mt-1">
                {stats.active} active • {stats.pendingLetters} pending • {stats.renewalsThisMonth} renewals • AED {(stats.monthlyRevenue || 0).toFixed(0)}/month
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Orders
            </Link>
            <Link
              href="/admin/secret-stash"
              className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Mail Club
            </Link>
            <button
              onClick={fetchMonthlyReport}
              className="inline-flex items-center rounded-full bg-purple-100 px-3 py-2 text-xs font-medium text-purple-700 shadow-sm hover:bg-purple-200"
            >
              <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Monthly Report
            </button>
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
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 shadow-sm ring-1 ring-yellow-200">
              <p className="text-xs text-yellow-700 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pendingLetters}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 shadow-sm ring-1 ring-emerald-200">
              <p className="text-xs text-emerald-700 uppercase tracking-wide">Monthly Revenue</p>
              <p className="text-2xl font-bold text-emerald-800">
                AED {(stats.monthlyRevenue || 0).toFixed(0)}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm ring-1 ring-purple-200">
              <p className="text-xs text-purple-700 uppercase tracking-wide">Renewals This Month</p>
              <p className="text-2xl font-bold text-purple-800">{stats.renewalsThisMonth || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-800 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {getMonthOptions().map((m) => (
                  <option key={m} value={m}>
                    {formatMonth(m)}
                  </option>
                ))}
              </select>
            </div>

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
                  placeholder="Search by email, name, mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
              <option value="superseded">Superseded</option>
            </select>

            {/* Delivery Filter */}
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">All Deliveries</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
            </select>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">All Tiers</option>
              <option value="1 month Subscription">1 Month</option>
              <option value="3 months Subscription">3 Months</option>
              <option value="6 months Subscription">6 Months</option>
              <option value="Yearly Subscription">Yearly</option>
            </select>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="created">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="status">Sort by Status</option>
                <option value="renewal">Sort by Renewal</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">
                {selectedIds.size} selected
              </span>
              <button
                onClick={selectAllPending}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                Select All Pending
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkMarkSent}
                disabled={selectedIds.size === 0 || actionLoading === "bulk"}
                className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "bulk" ? (
                  "Processing..."
                ) : (
                  <>
                    <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark Selected as Sent
                  </>
                )}
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={fetchSubscriptions}
                className="inline-flex items-center text-xs text-purple-600 hover:text-purple-700"
              >
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        {filteredSubscriptions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-100 text-center">
            <p className="text-neutral-500">No subscribers found matching your filters.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredSubscriptions.filter(s => s.status === "active").length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllPending();
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                        className="rounded border-neutral-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                      Subscriber
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                      Delivery Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                      {formatMonth(selectedMonth)} Package
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredSubscriptions.map((sub) => {
                    const deliveryStatus = sub.currentMonthDelivery?.status;
                    const isPending = sub.status === "active" && (!deliveryStatus || deliveryStatus === "pending");
                    const profile = sub.profile;

                    return (
                      <tr key={sub.id} className={selectedIds.has(sub.id) ? "bg-purple-50" : "hover:bg-neutral-50"}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sub.id)}
                            onChange={() => toggleSelection(sub.id)}
                            disabled={sub.status !== "active"}
                            className="rounded border-neutral-300 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-neutral-900">{sub.user_name || "—"}</p>
                            <p className="text-xs text-neutral-500">{sub.user_email}</p>
                            {profile?.mobile && (
                              <p className="text-xs text-neutral-400">{profile.mobile}</p>
                            )}
                            <p className="text-[10px] text-purple-600 font-medium mt-1">
                              Renews: {formatDate(sub.current_period_end)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-neutral-700 font-medium">{sub.tier_name || "Standard"}</span>
                            {sub.amount && (
                              <p className="text-[10px] text-emerald-600 font-medium">
                                AED {sub.amount}/{sub.billing_interval || "month"}
                              </p>
                            )}
                            <p className="text-[10px] text-neutral-400">
                              Since {formatDate(sub.created_at)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[sub.status] || "bg-neutral-100 text-neutral-800"}`}>
                            {sub.status.toUpperCase()}
                          </span>
                          {sub.cancel_at_period_end && (
                            <p className="text-[10px] text-orange-600 mt-0.5">Cancelling at period end</p>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          {profile ? (
                            <div className="text-xs text-neutral-600">
                              {profile.address_line1 && <p>{profile.address_line1}</p>}
                              {profile.building && <p>{profile.building}</p>}
                              {profile.area && <p>{profile.area}</p>}
                              {(profile.city || profile.emirate) && (
                                <p>{[profile.city, profile.emirate].filter(Boolean).join(", ")}</p>
                              )}
                              {profile.landmark && <p className="text-neutral-400">{profile.landmark}</p>}
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-xs">No address</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {deliveryStatus ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${deliveryStatusColors[deliveryStatus]}`}>
                              {deliveryStatus.toUpperCase()}
                            </span>
                          ) : sub.status === "active" ? (
                            <span className="text-yellow-600 text-xs font-medium">⏳ Pending</span>
                          ) : (
                            <span className="text-neutral-400 text-xs">—</span>
                          )}
                          {sub.currentMonthDelivery?.sent_at && (
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {formatDate(sub.currentMonthDelivery.sent_at)}
                            </p>
                          )}
                          {sub.currentMonthDelivery?.tracking_number && (
                            <p className="text-[10px] text-blue-600 mt-0.5">
                              📦 {sub.currentMonthDelivery.tracking_number}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {sub.status === "active" && (
                            <div className="space-y-2">
                              {isPending ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Tracking # (optional)"
                                    value={trackingInputs[sub.id] || ""}
                                    onChange={(e) => setTrackingInputs(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                    className="w-full rounded border border-neutral-200 px-2 py-1 text-xs focus:border-purple-300 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Notes (optional)"
                                    value={notesInputs[sub.id] || ""}
                                    onChange={(e) => setNotesInputs(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                    className="w-full rounded border border-neutral-200 px-2 py-1 text-xs focus:border-purple-300 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      markDeliveryStatus(sub.id, "sent", trackingInputs[sub.id], notesInputs[sub.id]);
                                      setTrackingInputs(prev => ({ ...prev, [sub.id]: "" }));
                                      setNotesInputs(prev => ({ ...prev, [sub.id]: "" }));
                                    }}
                                    disabled={actionLoading === sub.id}
                                    className="w-full inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                                  >
                                    {actionLoading === sub.id ? "..." : "Mark Sent"}
                                  </button>
                                </div>
                              ) : deliveryStatus === "sent" ? (
                                <div className="space-y-1">
                                  {sub.currentMonthDelivery?.tracking_number && (
                                    <p className="text-[10px] text-neutral-600">
                                      Tracking: {sub.currentMonthDelivery.tracking_number}
                                    </p>
                                  )}
                                  {sub.currentMonthDelivery?.notes && (
                                    <p className="text-[10px] text-neutral-600">
                                      {sub.currentMonthDelivery.notes}
                                    </p>
                                  )}
                                  <button
                                    onClick={() => markDeliveryStatus(sub.id, "delivered")}
                                    disabled={actionLoading === sub.id}
                                    className="w-full inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium text-green-800 hover:bg-green-200 disabled:opacity-50"
                                  >
                                    {actionLoading === sub.id ? "..." : "Mark Delivered"}
                                  </button>
                                </div>
                              ) : deliveryStatus === "delivered" ? (
                                <div className="text-[10px] text-green-600 font-medium">
                                  ✓ Delivered
                                  {sub.currentMonthDelivery?.delivered_at && (
                                    <p className="text-neutral-500 mt-0.5">
                                      {formatDate(sub.currentMonthDelivery.delivered_at)}
                                    </p>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Month-on-Month Report</h2>
                <button
                  onClick={() => setShowReport(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full"
                >
                  <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {Object.keys(monthlyStats).length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No data available yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Month</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">New Subs</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Packages Sent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {Object.entries(monthlyStats)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([month, data]: [string, any]) => (
                          <tr key={month}>
                            <td className="px-4 py-3 font-medium">{formatMonth(month)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                              +{data.newSubscriptions || 0}
                            </td>
                            <td className="px-4 py-3 text-right text-amber-600 font-semibold">
                              AED {(data.revenue || 0).toFixed(0)}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                              {data.lettersSent || 0}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
