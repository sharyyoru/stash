"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import type { Order, OrderStatus } from "../../lib/orders-store";

const STORAGE_PREFIX = "stash_profile_address";

type ProfileClientProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  orders?: Order[];
};

type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mobile: string;
  whatsapp: string;
  whatsappSameAsMobile: boolean;
};

const emptyAddress: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  mobile: "",
  whatsapp: "",
  whatsappSameAsMobile: true,
};

export default function ProfileClient({ name, email, image, orders = [] }: ProfileClientProps) {
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
