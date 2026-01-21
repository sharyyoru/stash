"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddressCompletionModal, { type Address } from "./address-completion-modal";

type ProductSubscribeButtonProps = {
  id: string;
  title: string;
  slug?: string;
  price?: number;
  subscriptionPrice?: number;
  currency?: string;
  imageUrl?: string;
};

export default function ProductSubscribeButton({
  id,
  title,
  slug,
  price,
  subscriptionPrice,
  currency = "AED",
  imageUrl,
}: ProductSubscribeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const monthlyPrice = subscriptionPrice || price || 0;

  const handleSubscribe = () => {
    if (!session?.user) {
      try {
        window.localStorage.setItem("stash_subscription_redirect", slug || id);
      } catch {}
      router.push(`/sign-in?callback=/products/${slug}`);
      return;
    }
    setShowAddressModal(true);
  };

  const handleAddressComplete = async (address: Address) => {
    setShowAddressModal(false);
    await proceedWithSubscription(address);
  };

  const proceedWithSubscription = async (profile: Address) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          productSlug: slug,
          productTitle: title,
          amount: monthlyPrice,
          currency,
          profile,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        try {
          window.localStorage.setItem("stash_subscription_redirect", slug || id);
        } catch {}
        router.push(`/sign-in?callback=/products/${slug}`);
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create subscription");
      }

      const redirectUrl: string | undefined = data?.redirectUrl;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setError("Subscription created. Payment gateway is being set up.");
    } catch (err: any) {
      setError(err?.message || "Could not create subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-3 pt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-semibold text-neutral-900">
            {currency} {monthlyPrice}
          </p>
          <span className="text-sm text-neutral-500">/month</span>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 space-y-1">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Monthly Subscription
          </p>
          <p className="text-[11px] text-amber-700">
            Billed monthly on the day you subscribe. Cancel anytime.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full rounded-full bg-amber-400 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : "Subscribe Now"}
        </button>

        <p className="text-[10px] text-center text-neutral-400">
          This is a subscription product. It will not be added to your stash.
        </p>
      </div>

      <AddressCompletionModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onComplete={handleAddressComplete}
      />
    </>
  );
}
