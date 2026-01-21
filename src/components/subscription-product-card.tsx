"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddressCompletionModal, { type Address } from "./address-completion-modal";

type SubscriptionProduct = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  subscriptionPrice?: number;
  currency?: string;
  shortDescription?: string;
  imageUrl?: string;
  isSubscription?: boolean;
  isSubscriptionCategory?: boolean;
};

interface SubscriptionProductCardProps {
  product: SubscriptionProduct;
}

export default function SubscriptionProductCard({ product }: SubscriptionProductCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const monthlyPrice = product.subscriptionPrice || product.price;
  const currency = product.currency || "AED";

  const handleSubscribe = () => {
    if (!session?.user) {
      try {
        window.localStorage.setItem("stash_subscription_redirect", product.slug);
      } catch {}
      router.push("/sign-in?callback=/category/the-secret-stash");
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
          productId: product._id,
          productSlug: product.slug,
          productTitle: product.title,
          amount: monthlyPrice,
          currency,
          profile,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        try {
          window.localStorage.setItem("stash_subscription_redirect", product.slug);
        } catch {}
        router.push("/sign-in?callback=/category/the-secret-stash");
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
      <div className="flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
        <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-neutral-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
              Product imagery coming soon.
            </div>
          )}
          <div className="absolute top-2 right-2 bg-amber-400 text-neutral-900 text-[10px] font-semibold px-2 py-1 rounded-full">
            SUBSCRIPTION
          </div>
        </div>
        
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-neutral-900">{product.title}</p>
          {product.shortDescription && (
            <p className="text-xs text-neutral-500 line-clamp-2">{product.shortDescription}</p>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-neutral-900">
              {currency} {monthlyPrice}
            </span>
            <span className="text-xs text-neutral-500">/month</span>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="mt-3 w-full rounded-full bg-amber-400 py-2.5 text-sm font-medium text-neutral-900 hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : "Subscribe Now"}
        </button>

        <p className="mt-2 text-[10px] text-center text-neutral-400">
          Billed monthly on the day you subscribe
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
