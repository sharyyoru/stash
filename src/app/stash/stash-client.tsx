"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart, type CartItem } from "../../components/cart-context";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AddressCompletionModal, { isAddressComplete, type Address } from "../../components/address-completion-modal";

export default function StashClient() {
  const { items, totalCount, totalAmount, currency, removeItem, clear, updateQuantity } = useCart();
  const router = useRouter();
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
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
        router.push("/sign-in?callback=/stash");
        return;
      }

      if (!res.ok) {
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
        if (!isMailClubOnly) {
          clear();
        }
        window.location.href = redirectUrl;
        return;
      }

      // Fallback: order created but no payment redirect
      if (!isMailClubOnly) {
        clear();
      }
      setCheckoutError("Order created. Payment gateway is being set up - we'll contact you.");
    } catch (error: any) {
      setCheckoutError(error?.message || "Could not create order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Your stash
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
              {hasItems ? "Review your stash" : "Your stash is empty"}
            </h1>
            <p className="text-xs text-neutral-600">
              {hasItems
                ? `You currently have ${totalCount} item${
                    totalCount === 1 ? "" : "s"
                  } saved in your stash.`
                : "Start adding products from the home page or product listings."}
            </p>
          </div>
          {hasItems && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Clear stash
            </button>
          )}
        </div>

        {hasItems ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <div className="space-y-3 rounded-3xl bg-white p-5 text-sm shadow-sm ring-1 ring-neutral-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Items
                </p>
                <p className="text-xs text-neutral-500">
                  {totalCount} item{totalCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-3"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                          Stash
                        </div>
                      )}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {item.title}
                      </p>
                      {item.priceText && (
                        <p className="text-xs text-neutral-600">{item.priceText}</p>
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
                      {item.slug && (
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-[11px] text-neutral-700 underline-offset-4 hover:underline"
                        >
                          View product
                        </Link>
                      )}
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
            </div>

            <div className="space-y-3 rounded-3xl bg-white p-5 text-sm shadow-sm ring-1 ring-neutral-200">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Summary
                </p>
                <p className="text-xs text-neutral-600">
                  Review your stash total and confirm your order. You'll be contacted about payment.
                </p>
              </div>
              <div className="mt-2 space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span>{formattedSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery (UAE)</span>
                    <span>{currency} {effectiveDeliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-200 text-base font-bold text-[#b08968]">
                    <span>Total</span>
                    <span>{formattedTotal}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-600">
                  We do not collect payment details yet. This order will be sent to the team with payment marked as pending.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!hasItems || isCheckingOut}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-neutral-800"
              >
                {isCheckingOut ? "Creating order..." : "Checkout"}
              </button>
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
        ) : (
          <div className="flex h-40 items-center justify-center rounded-3xl bg-white text-sm text-neutral-500 shadow-sm ring-1 ring-neutral-200">
            No items in your stash yet. Browse the home page or products to add a
            few favourites.
          </div>
        )}
      </div>

      {/* Address Completion Modal */}
      <AddressCompletionModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onComplete={handleAddressComplete}
        email={session?.user?.email}
        existingAddress={existingAddress}
      />
    </div>
  );
}
