"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import type { Order, OrderStatus } from "../../lib/orders-store";
import type { Subscription, SubscriptionStatus } from "../../lib/subscriptions-store";

const STORAGE_PREFIX = "stash_profile_address";

type ProfileClientProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  orders?: Order[];
  subscriptions?: Subscription[];
};

type Address = {
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

const emptyAddress: Address = {
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  mobile: "",
  whatsapp: "",
  whatsappSameAsMobile: true,
  dateOfBirth: "",
};

export default function ProfileClient({ name, email, image, orders = [], subscriptions = [] }: ProfileClientProps) {
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [status, setStatus] = useState<string>("");

  const firstName = typeof name === "string" && name.trim()
    ? name.trim().split(" ")[0]
    : "";

  const storageKey = email ? `${STORAGE_PREFIX}:${email}` : undefined;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Address>;
      setAddress((prev) => ({
        ...prev,
        line1: parsed.line1 ?? prev.line1,
        line2: parsed.line2 ?? prev.line2,
        landmark: parsed.landmark ?? prev.landmark,
        city: parsed.city ?? prev.city,
        state: parsed.state ?? prev.state,
        postalCode: parsed.postalCode ?? prev.postalCode,
        country: parsed.country ?? prev.country,
        mobile: parsed.mobile ?? prev.mobile,
        whatsapp: parsed.whatsapp ?? prev.whatsapp,
        whatsappSameAsMobile:
          typeof parsed.whatsappSameAsMobile === "boolean"
            ? parsed.whatsappSameAsMobile
            : prev.whatsappSameAsMobile,
        dateOfBirth: parsed.dateOfBirth ?? prev.dateOfBirth,
      }));
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleChange = (field: keyof Address, value: Address[keyof Address]) => {
    setAddress((prev) => {
      const next: Address = { ...prev, [field]: value } as Address;

      if (field === "mobile" && next.whatsappSameAsMobile) {
        next.whatsapp = String(value ?? "");
      }

      if (field === "whatsappSameAsMobile") {
        if (value) {
          next.whatsapp = next.mobile;
        } else {
          next.whatsapp = "";
        }
      }

      return next;
    });
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(address));
      setStatus("Saved");
      window.setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Could not save. Check your browser storage settings.");
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const initial = firstName ? firstName.charAt(0).toUpperCase() : "";

  const hasOrders = Array.isArray(orders) && orders.length > 0;
  const hasSubscriptions = Array.isArray(subscriptions) && subscriptions.length > 0;

  const statusLabel = (status: OrderStatus): string => {
    switch (status) {
      case "payment-pending":
        return "Payment pending";
      case "paid":
        return "Paid";
      case "in-transit":
        return "In transit";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  const subscriptionStatusLabel = (status: SubscriptionStatus): string => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "cancelled":
        return "Cancelled";
      case "past_due":
        return "Past Due";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const subscriptionStatusColor = (status: SubscriptionStatus): string => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "paused":
        return "bg-amber-500";
      case "cancelled":
        return "bg-neutral-400";
      case "past_due":
        return "bg-red-500";
      case "pending":
        return "bg-blue-500";
      default:
        return "bg-neutral-500";
    }
  };

  const getOrdinalSuffix = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const formatOrderDate = (iso: string): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Dubai",
    });
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={name || "Profile"}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Profile
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                {firstName ? `${firstName}'s Stash` : "Your stash"}
              </h1>
              {email && (
                <p className="text-xs text-neutral-600">{email}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            Log out
          </button>
        </div>

        {/* Subscriptions Section */}
        {hasSubscriptions && (
          <div className="space-y-3 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-sm shadow-sm ring-1 ring-amber-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-700">
                  My Subscriptions
                </p>
                <p className="text-xs text-amber-600">
                  Your active monthly subscriptions
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400">
                <svg className="h-5 w-5 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="space-y-2 rounded-2xl border border-amber-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{sub.productTitle}</p>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                        {sub.id}
                      </p>
                    </div>
                    <span className={`rounded-full ${subscriptionStatusColor(sub.status)} px-2 py-0.5 text-[10px] font-semibold text-white`}>
                      {subscriptionStatusLabel(sub.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-neutral-500">Monthly Amount</p>
                      <p className="font-medium text-neutral-900">{sub.currency} {sub.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Billing Day</p>
                      <p className="font-medium text-neutral-900">{sub.billingDay}{getOrdinalSuffix(sub.billingDay)} of each month</p>
                    </div>
                  </div>
                  {sub.status === "active" && sub.nextBillingDate && (
                    <div className="rounded-xl bg-amber-50 p-2 text-[11px]">
                      <p className="text-amber-700">
                        <span className="font-medium">Next billing:</span>{" "}
                        {new Date(sub.nextBillingDate).toLocaleDateString("en-AE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          <form
            onSubmit={handleSave}
            className="space-y-4 rounded-3xl bg-white p-5 text-sm shadow-sm ring-1 ring-neutral-200"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Delivery address
              </p>
              <p className="text-xs text-neutral-600">
                Save where you want your stash to be delivered. You can update this any time.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="line1" className="text-xs font-medium text-neutral-700">
                  Address line 1
                </label>
                <input
                  id="line1"
                  type="text"
                  value={address.line1}
                  onChange={(e) => handleChange("line1", e.target.value)}
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="line2" className="text-xs font-medium text-neutral-700">
                  Address line 2 (optional)
                </label>
                <input
                  id="line2"
                  type="text"
                  value={address.line2}
                  onChange={(e) => handleChange("line2", e.target.value)}
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="landmark" className="text-xs font-medium text-neutral-700">
                  Landmark (optional)
                </label>
                <input
                  id="landmark"
                  type="text"
                  value={address.landmark}
                  onChange={(e) => handleChange("landmark", e.target.value)}
                  placeholder="Near mall, opposite park, etc."
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="city" className="text-xs font-medium text-neutral-700">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={address.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="state" className="text-xs font-medium text-neutral-700">
                    State / Emirate
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={address.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="postal" className="text-xs font-medium text-neutral-700">
                    Postal code
                  </label>
                  <input
                    id="postal"
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="country" className="text-xs font-medium text-neutral-700">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={address.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="mobile" className="text-xs font-medium text-neutral-700">
                    Mobile number
                  </label>
                  <input
                    id="mobile"
                    type="tel"
                    value={address.mobile}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="whatsapp" className="text-xs font-medium text-neutral-700">
                    WhatsApp number
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    value={address.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                    disabled={address.whatsappSameAsMobile}
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-500"
                  />
                  <label className="mt-1 inline-flex items-center gap-2 text-[11px] text-neutral-600">
                    <input
                      type="checkbox"
                      checked={address.whatsappSameAsMobile}
                      onChange={(e) => handleChange("whatsappSameAsMobile", e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-300"
                    />
                    <span>My WhatsApp number is the same as my mobile number</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="dob" className="text-xs font-medium text-neutral-700">
                  Date of Birth (optional)
                </label>
                <input
                  id="dob"
                  type="date"
                  value={address.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800"
              >
                Save address
              </button>
              {status && (
                <p className="text-[11px] text-neutral-500">{status}</p>
              )}
            </div>
          </form>

          <div className="space-y-3 rounded-3xl bg-white p-5 text-sm shadow-sm ring-1 ring-neutral-200">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Orders
              </p>
              <p className="text-xs text-neutral-600">
                {hasOrders
                  ? "Your recent Stash orders."
                  : "When you start ordering, you'll see your recent Stash orders here."}
              </p>
            </div>
            {hasOrders ? (
              <div className="space-y-2 text-xs text-neutral-700">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="space-y-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                          {order.id}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {statusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600">
                      {order.currency} {order.totalAmount.toFixed(2)} · {order.totalCount} item
                      {order.totalCount === 1 ? "" : "s"}
                    </p>
                    <div className="mt-1 space-y-0.5 text-[11px] text-neutral-600">
                      {order.items.map((item, index) => {
                        if (index > 2) return null;
                        return (
                          <p key={item.id}>
                            {item.title} × {item.quantity}
                          </p>
                        );
                      })}
                      {order.items.length > 3 && (
                        <p className="text-[11px] text-neutral-500">
                          + {order.items.length - 3} more item
                          {order.items.length - 3 === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                No orders yet. Time to start stashing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
