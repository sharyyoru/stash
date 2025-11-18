"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { CartItem, useCart } from "./cart-context";

type CartButtonProps = {
  label: string;
};

export default function CartButton({ label }: CartButtonProps) {
  const { items, totalCount, totalAmount, currency, removeItem, clear, updateQuantity } = useCart();
  const [open, setOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { data: session } = useSession();

  const hasItems = items.length > 0;

  const formattedTotal = totalAmount > 0
    ? `${currency} ${totalAmount.toFixed(2).replace(/\.00$/, "")}`
    : `${currency} 0`;

  const handleDecrease = (item: CartItem) => {
    if (item.quantity <= 1) {
      setPendingRemoveId(item.id);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = (item: CartItem) => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const pendingItem = pendingRemoveId
    ? items.find((i) => i.id === pendingRemoveId) || null
    : null;

  const handleCheckout = async () => {
    if (!hasItems || isCheckingOut) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    setOrderId(null);

    // Best-effort profile snapshot from localStorage, keyed by email like the profile page.
    let profile: any = null;
    try {
      const email = session?.user?.email;
      if (email) {
        const storageKey = `stash_profile_address:${email}`;
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          profile = JSON.parse(raw);
        }
      }
    } catch {
      // ignore profile errors
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalAmount,
          totalCount,
          currency,
          profile,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create order");
      }

      const data = await res.json();
      const createdId: string | undefined = data?.order?.id;
      if (createdId) {
        setOrderId(createdId);
      }
      clear();
    } catch (error) {
      setCheckoutError("Could not create order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-full bg-[#f3b560] px-4 text-xs font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e9a946]"
        aria-label="Open stash"
        onClick={() => setOpen(true)}
      >
        <span className="hidden md:inline">{label}</span>
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-neutral-900">
          {totalCount}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-neutral-200">
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>

            <div className="space-y-4 pt-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Your stash
                  </p>
                  <h2 className="text-base font-semibold text-neutral-900">
                    {hasItems ? `${totalCount} item${totalCount === 1 ? "" : "s"} in stash` : "Stash is empty"}
                  </h2>
                  {totalAmount > 0 && (
                    <p className="mt-1 text-lg font-bold text-[#b08968]">
                      {formattedTotal}
                    </p>
                  )}
                </div>
              </div>

              {hasItems ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-2"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                            Stash
                          </div>
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="truncate text-xs font-semibold text-neutral-900">
                          {item.title}
                        </p>
                        {item.priceText && (
                          <p className="text-[11px] text-neutral-600">
                            {item.priceText}
                          </p>
                        )}
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-neutral-700 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item)}
                            className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 leading-none"
                          >
                            –
                          </button>
                          <span className="min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrease(item)}
                            className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 leading-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] text-neutral-500 underline-offset-4 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                  Nothing in your stash yet. Start adding a few favourites.
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <Link
                    href="/stash"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    View full stash
                  </Link>
                  {hasItems && (
                    <button
                      type="button"
                      onClick={clear}
                      className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                    >
                      Clear stash
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!hasItems || isCheckingOut}
                  className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-1.5 font-medium text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800"
                >
                  {isCheckingOut ? "Creating order..." : "Checkout"}
                </button>
              </div>
              {orderId && (
                <p className="mt-2 text-[11px] font-medium text-emerald-700">
                  Order {orderId} created. We'll be in touch about payment.
                </p>
              )}
              {checkoutError && (
                <p className="mt-2 text-[11px] text-red-600">{checkoutError}</p>
              )}
            </div>
          </div>
          {pendingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-sm shadow-lg ring-1 ring-neutral-200">
                <p className="text-sm font-semibold text-neutral-900">
                  Remove from stash?
                </p>
                <p className="mt-2 text-xs text-neutral-600">
                  Do you want to remove {pendingItem.title} from your stash?
                </p>
                <div className="mt-4 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPendingRemoveId(null)}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-700 shadow-sm hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(pendingItem.id);
                      setPendingRemoveId(null);
                    }}
                    className="rounded-full bg-neutral-900 px-3 py-1.5 text-white shadow-sm hover:bg-neutral-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
