"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string;
  mobile?: string;
  address?: {
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    mobile: string;
    whatsapp: string;
    whatsappSameAsMobile: boolean;
    dateOfBirth: string;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
  subscription_count?: number;
  order_count?: number;
  total_spent?: number;
};

type PaginationData = {
  users: User[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function CRMPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    hasSubscription: "all",
    hasOrders: "all",
    hasAddress: "all",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, page, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        ...filters,
      });

      const response = await fetch(`/api/admin/crm?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data: PaginationData = await response.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    // Navigate to user profile
    router.push(`/admin/user/${encodeURIComponent(user.email)}`);
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount || 0);
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-600">
              Customer Management
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              CRM
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {total} total users
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Smart Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, mobile..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Subscriptions
              </label>
              <select
                value={filters.hasSubscription}
                onChange={(e) => setFilters({ ...filters, hasSubscription: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="all">All Users</option>
                <option value="yes">Has Subscription</option>
                <option value="no">No Subscription</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Orders
              </label>
              <select
                value={filters.hasOrders}
                onChange={(e) => setFilters({ ...filters, hasOrders: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="all">All Users</option>
                <option value="yes">Has Orders</option>
                <option value="no">No Orders</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => handleUserClick(user)}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-neutral-900 hover:text-purple-600">
                              {user.name || "No Name"}
                            </p>
                            <p className="text-sm text-neutral-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-600">
                            {user.mobile && <p>📱 {user.mobile}</p>}
                            {user.address?.whatsapp && user.address.whatsapp !== user.mobile && (
                              <p>💬 {user.address.whatsapp}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.address ? (
                            <div className="text-sm text-neutral-600 max-w-[200px] truncate">
                              <p>{user.address.line1}</p>
                              <p>{[user.address.city, user.address.state].filter(Boolean).join(", ")}</p>
                              <p>{user.address.country}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400">No address</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-600">
                            {user.subscription_count && (
                              <p>📦 {user.subscription_count} subscription{user.subscription_count !== 1 ? "s" : ""}</p>
                            )}
                            {user.order_count && (
                              <p>🛒 {user.order_count} order{user.order_count !== 1 ? "s" : ""}</p>
                            )}
                            {user.last_login && (
                              <p className="text-xs text-neutral-400">Last login: {formatDate(user.last_login)}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {user.total_spent && (
                              <p className="font-medium text-emerald-600">{formatCurrency(user.total_spent)}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-neutral-600">{formatDate(user.created_at)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-500">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-neutral-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
