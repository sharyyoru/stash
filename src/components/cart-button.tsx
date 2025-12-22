"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { CartItem, useCart } from "./cart-context";
import AddressCompletionModal, { isAddressComplete, type Address } from "./address-completion-modal";

type CartButtonProps = {
  label: string;
};

export default function CartButton({ label }: CartButtonProps) {
  const { items, totalCount, totalAmount, currency, removeItem, clear, updateQuantity } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [existingAddress, setExistingAddress] = useState<Partial<Address> | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(25);
  const { data: session } = useSession();

  const hasItems = items.length > 0;

  // Fetch delivery charge on mount
  useEffect(() => {
    fetch('/api/delivery-charge')
      .then(res => res.json())
      .then(data => setDeliveryCharge(data.deliveryCharge || 25))
      .catch(() => setDeliveryCharge(25));
  }, []);

  const isMailClubOnly = items.length > 0 && items.every((item) => item.slug === "the-secret-stash-mail-club");
  const effectiveDeliveryCharge = isMailClubOnly ? 0 : deliveryCharge;

  const subtotal = totalAmount;
  const total = subtotal + effectiveDeliveryCharge;
  const formattedSubtotal = subtotal > 0
    ? `${currency} ${subtotal.toFixed(2).replace(/\.00$/, "")}`
    : `${currency} 0`;
  const formattedTotal = total > 0
    ? `${currency} ${total.toFixed(2).replace(/\.00$/, "")}`
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

  useEffect(() => {
    if (pathname !== "/stash") return;
    try {
      const flag = window.localStorage.getItem("stash_open_cart_after_login");
      if (flag === "1") {
        window.localStorage.removeItem("stash_open_cart_after_login");
        setOpen(true);
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  // Get existing address from localStorage
  const getStoredAddress = (): Partial<Address> | null => {
    try {
      const email = session?.user?.email;
      if (email) {
        const storageKey = `stash_profile_address:${email}`;
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleCheckout = async () => {
    if (!hasItems || isCheckingOut) return;
    
    // Check if user is logged in
    if (!session?.user) {
      try {
        window.localStorage.setItem("stash_open_cart_after_login", "1");
      } catch {}
      setOpen(false);
      router.push("/sign-in?callback=/stash");
      return;
    }

    // Check if address is complete
    const storedAddress = getStoredAddress();
    if (!isAddressComplete(storedAddress)) {
      setExistingAddress(storedAddress);
      setShowAddressModal(true);
      return;
    }

    // Proceed with checkout
    await proceedWithCheckout(storedAddress as Address);
  };

  const handleAddressComplete = async (address: Address) => {
    setShowAddressModal(false);
    await proceedWithCheckout(address);
  };

  const proceedWithCheckout = async (profile: Address) => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    setOrderId(null);

    try {
      // Use the new checkout API that creates a Ziina payment intent
      const res = await fetch("/api/checkout", {
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

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        try {
          window.localStorage.setItem("stash_open_cart_after_login", "1");
        } catch {}
        setOpen(false);
        router.push("/sign-in?callback=/stash");
        return;
      }

      if (!res.ok) {
        // Check if it's a payment gateway configuration error
        if (res.status === 503) {
          throw new Error(data?.error || "Payment gateway not available");
        }
        throw new Error(data?.error || "Failed to create checkout");
      }

      const createdId: string | undefined = data?.order?.id;
      const redirectUrl: string | undefined = data?.redirectUrl;

      if (createdId) {
        setOrderId(createdId);
      }

      // If we have a redirect URL from Ziina, redirect to payment page
      if (redirectUrl) {
        clear();
        window.location.href = redirectUrl;
        return;
      }

      // Fallback: order created but no payment redirect (Ziina not configured)
      clear();
      setCheckoutError("Order created. Payment gateway is being set up - we'll contact you.");
    } catch (error: any) {
      setCheckoutError(error?.message || "Could not create order. Please try again.");
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <div className="relative w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-lg ring-1 ring-neutral-200 max-h-[90vh] sm:max-h-[85vh]">
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
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span>{formattedSubtotal}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>Delivery</span>
                        <span>{currency} {effectiveDeliveryCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-neutral-200 font-bold text-[#b08968]">
                        <span>Total</span>
                        <span>{formattedTotal}</span>
                      </div>
                    </div>
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
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-semibold text-neutral-900">
                          {item.title}
                          {item.customization && (
                            <span className="ml-1 text-[10px] font-medium text-[#b08968]">
                              (Custom)
                            </span>
                          )}
                        </p>
                        {item.priceText && (
                          <p className="text-[11px] text-neutral-600">
                            {item.priceText}
                          </p>
                        )}
                        {item.customization && (
                          <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                            "{item.customization.text.slice(0, 30)}{item.customization.text.length > 30 ? '...' : ''}"
                          </p>
                        )}
                        <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 text-[11px] text-neutral-700 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item)}
                            className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-full border border-neutral-300 leading-none active:bg-neutral-100"
                          >
                            –
                          </button>
                          <span className="min-w-[1.5rem] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrease(item)}
                            className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-full border border-neutral-300 leading-none active:bg-neutral-100"
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

      {/* Address Completion Modal */}
      <AddressCompletionModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onComplete={handleAddressComplete}
        email={session?.user?.email}
        existingAddress={existingAddress}
      />
    </>
  );
}
