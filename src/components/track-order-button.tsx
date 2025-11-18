"use client";

import { useState } from "react";

type OrderStatus = "payment-pending" | "paid" | "in-transit" | "delivered";

type TrackedOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  totalAmount: number;
  totalCount: number;
  currency: string;
};

function statusLabel(status: OrderStatus): string {
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
}

type TrackOrderButtonProps = {
  className?: string;
};

export default function TrackOrderButton({ className }: TrackOrderButtonProps) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = orderId.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(trimmed)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = (data as any)?.error || "Order not found";
        throw new Error(message);
      }
      const o = (data as any)?.order;
      if (o) {
        setOrder({
          id: o.id,
          createdAt: o.createdAt,
          status: o.status,
          totalAmount: o.totalAmount,
          totalCount: o.totalCount,
          currency: o.currency,
        });
      } else {
        throw new Error("Order not found");
      }
    } catch (err: any) {
      setError(err?.message || "Could not find that order.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setOrderId("");
    setOrder(null);
    setError(null);
    setIsSearching(false);
  };

  return (
    <>
      <button
        type="button"
        className={
          className ||
          "transition-colors hover:text-[#b08968]"
        }
        onClick={() => setOpen(true)}
      >
        Track order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-5 text-sm shadow-lg ring-1 ring-neutral-200">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              aria-label="Close track order"
            >
              <span aria-hidden="true">×</span>
            </button>

            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Track order
                </p>
                <p className="text-xs text-neutral-600">
                  Enter your order ID to see the latest status of your stash.
                </p>
              </div>

              <form onSubmit={handleLookup} className="space-y-3">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-XXXX..."
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                />
                <button
                  type="submit"
                  disabled={!orderId.trim() || isSearching}
                  className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-neutral-800"
                >
                  {isSearching ? "Checking..." : "Check status"}
                </button>
              </form>

              {error && (
                <p className="text-[11px] text-red-600">{error}</p>
              )}

              {order && (
                <div className="space-y-1 rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-700">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    {order.id}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-neutral-900">
                    {order.currency} {order.totalAmount.toFixed(2)} · {order.totalCount} item
                    {order.totalCount === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs">
                    Status: <span className="font-semibold">{statusLabel(order.status)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
