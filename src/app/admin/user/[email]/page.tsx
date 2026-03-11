"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type UserProfile = {
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
};

type UserSubscription = {
  id: string;
  tier_name: string;
  status: string;
  amount: number;
  billing_interval: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  cancel_at_period_end: boolean;
};

type UserOrder = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

export default function UserProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email && typeof email === "string") {
      fetchUserData(email as string);
    }
  }, [email]);

  const fetchUserData = async (userEmail: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user profile
      const profileResponse = await fetch(`/api/admin/user/${encodeURIComponent(userEmail)}`);
      if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
      const profileData = await profileResponse.json();
      setUser(profileData.user);

      // Fetch subscriptions
      const subsResponse = await fetch(`/api/admin/user/${encodeURIComponent(userEmail)}/subscriptions`);
      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        setSubscriptions(subsData.subscriptions || []);
      }

      // Fetch orders
      const ordersResponse = await fetch(`/api/admin/user/${encodeURIComponent(userEmail)}/orders`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
      past_due: "bg-orange-100 text-orange-800",
      "payment-pending": "bg-yellow-100 text-yellow-800",
      paid: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      "in-transit": "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-64"></div>
            <div className="h-32 bg-neutral-200 rounded"></div>
            <div className="h-96 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-800">Error: {error || "User not found"}</p>
            <Link href="/admin/crm" className="mt-4 inline-flex items-center text-red-600 hover:text-red-800">
              ← Back to CRM
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/crm" className="text-purple-600 hover:text-purple-800 text-sm">
              ← Back to CRM
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 mt-2">
              {user.name || "User Profile"}
            </h1>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-500">Name</p>
                  <p className="font-medium">{user.name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Mobile</p>
                  <p className="font-medium">{user.mobile || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Member Since</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
                {user.last_login && (
                  <div>
                    <p className="text-sm text-neutral-500">Last Login</p>
                    <p className="font-medium">{formatDate(user.last_login)}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Delivery Address</h3>
              {user.address ? (
                <div className="text-sm text-neutral-600 space-y-1">
                  <p>{user.address.line1}</p>
                  {user.address.line2 && <p>{user.address.line2}</p>}
                  {user.address.landmark && <p>{user.address.landmark}</p>}
                  <p>{[user.address.city, user.address.state].filter(Boolean).join(", ")}</p>
                  <p>{user.address.postalCode}</p>
                  <p>{user.address.country}</p>
                  <p className="text-neutral-500 mt-2">
                    📱 {user.address.mobile}
                    {user.address.whatsapp && user.address.whatsapp !== user.address.mobile && (
                      <> • 💬 {user.address.whatsapp}</>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">No address on file</p>
              )}
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Subscriptions ({subscriptions.length})
          </h2>
          {subscriptions.length === 0 ? (
            <p className="text-neutral-500">No subscriptions</p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">{sub.tier_name}</p>
                      <p className="text-sm text-neutral-500">
                        {formatCurrency(sub.amount)}/{sub.billing_interval}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatDate(sub.created_at)} - {formatDate(sub.current_period_end)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Orders ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-neutral-500">No orders</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Order #{order.id.slice(-8)}</p>
                      <p className="text-sm text-neutral-500">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
