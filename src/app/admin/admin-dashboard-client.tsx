"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DashboardData = {
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  };
  subscriptions: {
    total: number;
    active: number;
    cancelled: number;
    pastDue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
  recentActivity: Array<{
    id: string;
    type: "order" | "subscription";
    status: string;
    amount?: number;
    date: string;
    email?: string;
  }>;
  lastUpdated: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
  }).format(amount);
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    "payment-pending": "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    "in-transit": "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    active: "bg-emerald-100 text-emerald-800",
    "past-due": "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export default function AdminDashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-600">
              Admin Dashboard
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Overview
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Last updated: {formatDate(data.lastUpdated)}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <svg className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/orders"
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md hover:ring-neutral-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Orders</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-1">{data.orders.total}</p>
            <p className="text-xs text-neutral-500">
              {data.orders.pending} pending • {data.orders.processing} processing
            </p>
          </Link>

          <Link
            href="/admin/subscribers"
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md hover:ring-neutral-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-full bg-emerald-100 p-3">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Subscribers</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-1">{data.subscriptions.active}</p>
            <p className="text-xs text-neutral-500">
              {data.subscriptions.monthlyRevenue > 0 && formatCurrency(data.subscriptions.monthlyRevenue)}/month
            </p>
          </Link>

          <Link
            href="/admin/secret-stash"
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md hover:ring-neutral-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Mail Club</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-1">{data.subscriptions.total}</p>
            <p className="text-xs text-neutral-500">
              Total subscriptions
            </p>
          </Link>

          <Link
            href="/admin/crm"
            className="group rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-sm ring-1 ring-emerald-200 transition-all hover:shadow-md hover:ring-emerald-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-full bg-emerald-100 p-3">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-emerald-900 mb-1">CRM</h3>
            <p className="text-2xl font-bold text-emerald-900 mb-1">{data.subscriptions.total}</p>
            <p className="text-xs text-emerald-700">
              Total users
            </p>
          </Link>

          <Link
            href="/admin/stripe-sync"
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md hover:ring-neutral-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-full bg-orange-100 p-3">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Stripe Sync</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-1">Bridge</p>
            <p className="text-xs text-neutral-500">
              Sync Stripe data
            </p>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Stats */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Orders Overview</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold text-neutral-900">{data.orders.total}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.orders.totalRevenue)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-yellow-50 rounded-lg">
                <p className="font-semibold text-yellow-800">{data.orders.pending}</p>
                <p className="text-xs text-yellow-600">Pending</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-800">{data.orders.processing}</p>
                <p className="text-xs text-blue-600">Processing</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="font-semibold text-green-800">{data.orders.delivered}</p>
                <p className="text-xs text-green-600">Delivered</p>
              </div>
            </div>
          </div>

          {/* Subscriptions Stats */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Subscription Revenue</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Monthly Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.subscriptions.monthlyRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Yearly Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.subscriptions.yearlyRevenue)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-emerald-50 rounded-lg">
                <p className="font-semibold text-emerald-800">{data.subscriptions.active}</p>
                <p className="text-xs text-emerald-600">Active</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="font-semibold text-red-800">{data.subscriptions.cancelled}</p>
                <p className="text-xs text-red-600">Cancelled</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <p className="font-semibold text-orange-800">{data.subscriptions.pastDue}</p>
                <p className="text-xs text-orange-600">Past Due</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {data.recentActivity.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                No recent activity found.
              </div>
            ) : (
              data.recentActivity.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}-${index}`} className="p-4 hover:bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === "order" ? "bg-blue-500" : "bg-emerald-500"
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900 capitalize">
                            {activity.type}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(activity.status)}`}>
                            {activity.status.replace("-", " ")}
                          </span>
                        </div>
                        {activity.email && (
                          <p className="text-sm text-neutral-500">{activity.email}</p>
                        )}
                        <p className="text-xs text-neutral-400">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                    {activity.amount && (
                      <p className="font-semibold text-neutral-900">{formatCurrency(activity.amount)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Additional Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/deliveries"
            className="group rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm ring-1 ring-blue-200 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Delivery Management</h3>
                <p className="text-sm text-blue-700">Track and manage shipments</p>
              </div>
              <svg className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </Link>

          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm ring-1 ring-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">System Status</h3>
                <p className="text-sm text-purple-700">All systems operational</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
