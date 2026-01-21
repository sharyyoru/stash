"use client";

import SubscriptionProductCard from "./subscription-product-card";

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

interface SubscriptionProductGridProps {
  products: SubscriptionProduct[];
}

export default function SubscriptionProductGrid({ products }: SubscriptionProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        No subscription products available yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => (
        <SubscriptionProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
