"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DiscountCode = {
  id: string;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  appliesTo: "all" | "products" | "subscriptions";
  createdAt: string;
};

type DiscountUsage = {
  id: string;
  discountCodeId: string;
  orderId: string;
  userEmail: string | null;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  createdAt: string;
  code?: string;
  description?: string;
};

type Stats = {
  totalUsage: number;
  totalDiscountAmount: number;
  totalOrderValue: number;
  averageDiscount: number;
  codeBreakdown: Array<{
    code: string;
    usageCount: number;
    totalDiscount: number;
  }>;
};

export default function DiscountCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [usage, setUsage] = useState<DiscountUsage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"codes" | "usage" | "stats">("codes");

  // Filters
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCodeId, setSelectedCodeId] = useState<string>("");

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: "",
    usageLimit: "",
    expiresAt: "",
    appliesTo: "all" as "all" | "products" | "subscriptions",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, activeTab, dateRange, selectedCodeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "codes") {
        const res = await fetch("/api/admin/discounts?action=list");
        const data = await res.json();
        if (data.codes) setCodes(data.codes);
      } else if (activeTab === "usage") {
        const params = new URLSearchParams({ action: "usage" });
        if (dateRange.start) params.set("startDate", dateRange.start);
        if (dateRange.end) params.set("endDate", dateRange.end);
        if (selectedCodeId) params.set("codeId", selectedCodeId);

        const res = await fetch(`/api/admin/discounts?${params}`);
        const data = await res.json();
        if (data.usage) setUsage(data.usage);
      } else if (activeTab === "stats") {
        const params = new URLSearchParams({ action: "stats" });
        if (dateRange.start) params.set("startDate", dateRange.start);
        if (dateRange.end) params.set("endDate", dateRange.end);

        const res = await fetch(`/api/admin/discounts?${params}`);
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.code.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.code,
          description: newCode.description || null,
          discountType: newCode.discountType,
          discountValue: newCode.discountValue,
          minOrderAmount: newCode.minOrderAmount || 0,
          maxDiscountAmount: newCode.maxDiscountAmount ? Number(newCode.maxDiscountAmount) : null,
          usageLimit: newCode.usageLimit ? Number(newCode.usageLimit) : null,
          expiresAt: newCode.expiresAt || null,
          appliesTo: newCode.appliesTo,
          isActive: true,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCode({
          code: "",
          description: "",
          discountType: "percentage",
          discountValue: 10,
          minOrderAmount: 0,
          maxDiscountAmount: "",
          usageLimit: "",
          expiresAt: "",
          appliesTo: "all",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create code:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      await fetch(`/api/admin/discounts/${code.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !code.isActive }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle code:", error);
    }
  };

  const handleDeleteCode = async (code: DiscountCode) => {
    if (!confirm(`Are you sure you want to delete code "${code.code}"?`)) return;

    try {
      await fetch(`/api/admin/discounts/${code.id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to delete code:", error);
    }
  };

  const filteredUsage = usage.filter((u) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.orderId.toLowerCase().includes(query) ||
      u.userEmail?.toLowerCase().includes(query) ||
      u.code?.toLowerCase().includes(query)
    );
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-neutral-500 hover:text-neutral-700">
              ← Back to Admin
            </Link>
            <h1 className="text-xl font-bold text-neutral-900">Discount Codes</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            + Create Code
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1">
            {(["codes", "usage", "stats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? "border-b-2 border-amber-500 text-amber-600"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab === "codes" ? "Discount Codes" : tab === "usage" ? "Usage History" : "Statistics"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {activeTab !== "codes" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-500">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="mt-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="mt-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </>
            )}
            {activeTab === "usage" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-500">Filter by Code</label>
                  <select
                    value={selectedCodeId}
                    onChange={(e) => setSelectedCodeId(e.target.value)}
                    className="mt-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                  >
                    <option value="">All Codes</option>
                    {codes.map((code) => (
                      <option key={code.id} value={code.id}>
                        {code.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-500">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by order ID, email, or code..."
                    className="mt-1 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </>
            )}
            {activeTab !== "codes" && (
              <button
                onClick={fetchData}
                className="mt-5 rounded-lg bg-neutral-100 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Apply Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {activeTab === "codes" && (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Applies To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Expires</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono font-semibold text-neutral-900">{code.code}</span>
                        {code.description && (
                          <p className="text-xs text-neutral-500">{code.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-green-600">
                        {code.discountType === "percentage"
                          ? `${code.discountValue}%`
                          : `AED ${code.discountValue}`}
                      </span>
                      {code.minOrderAmount > 0 && (
                        <p className="text-xs text-neutral-500">Min: AED {code.minOrderAmount}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-neutral-700">
                        {code.usageCount}
                        {code.usageLimit && ` / ${code.usageLimit}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600">
                        {code.appliesTo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          code.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {code.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {code.expiresAt
                        ? new Date(code.expiresAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className="text-xs text-neutral-500 hover:text-neutral-700"
                        >
                          {code.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                      No discount codes found. Create one to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Original</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Discount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsage.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-neutral-900">{u.code || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders?id=${u.orderId}`}
                        className="font-mono text-sm text-amber-600 hover:underline"
                      >
                        {u.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {u.userEmail || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-600">
                      AED {u.originalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                      -AED {u.discountAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900">
                      AED {u.finalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {filteredUsage.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                      No usage history found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "stats" && stats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-500">Total Uses</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{stats.totalUsage}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-500">Total Discounted</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  AED {stats.totalDiscountAmount.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-500">Order Value (Pre-discount)</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">
                  AED {stats.totalOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-500">Avg Discount per Use</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">
                  AED {stats.averageDiscount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Code Breakdown */}
            <div className="rounded-xl border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 px-4 py-3">
                <h3 className="font-semibold text-neutral-900">Breakdown by Code</h3>
              </div>
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Code</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Uses</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Total Discount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {stats.codeBreakdown.map((item) => (
                    <tr key={item.code} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono font-medium text-neutral-900">{item.code}</td>
                      <td className="px-4 py-3 text-right text-neutral-700">{item.usageCount}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        AED {item.totalDiscount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {stats.codeBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                        No usage data available for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-neutral-900">Create Discount Code</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Code *</label>
                <input
                  type="text"
                  value={newCode.code}
                  onChange={(e) => setNewCode((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., STASH10"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Description</label>
                <input
                  type="text"
                  value={newCode.description}
                  onChange={(e) => setNewCode((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., 10% off your order"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Type</label>
                  <select
                    value={newCode.discountType}
                    onChange={(e) =>
                      setNewCode((prev) => ({
                        ...prev,
                        discountType: e.target.value as "percentage" | "fixed",
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Value {newCode.discountType === "percentage" ? "(%)" : "(AED)"}
                  </label>
                  <input
                    type="number"
                    value={newCode.discountValue}
                    onChange={(e) =>
                      setNewCode((prev) => ({ ...prev, discountValue: Number(e.target.value) }))
                    }
                    min={0}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Min Order (AED)</label>
                  <input
                    type="number"
                    value={newCode.minOrderAmount}
                    onChange={(e) =>
                      setNewCode((prev) => ({ ...prev, minOrderAmount: Number(e.target.value) }))
                    }
                    min={0}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Usage Limit</label>
                  <input
                    type="number"
                    value={newCode.usageLimit}
                    onChange={(e) => setNewCode((prev) => ({ ...prev, usageLimit: e.target.value }))}
                    placeholder="Unlimited"
                    min={1}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Applies To</label>
                  <select
                    value={newCode.appliesTo}
                    onChange={(e) =>
                      setNewCode((prev) => ({
                        ...prev,
                        appliesTo: e.target.value as "all" | "products" | "subscriptions",
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  >
                    <option value="all">All</option>
                    <option value="products">Products Only</option>
                    <option value="subscriptions">Subscriptions Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Expires At</label>
                  <input
                    type="date"
                    value={newCode.expiresAt}
                    onChange={(e) => setNewCode((prev) => ({ ...prev, expiresAt: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCode}
                disabled={creating || !newCode.code.trim()}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
