"use client";

import Image from "next/image";
import Link from "next/link";

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
  const monthlyPrice = product.subscriptionPrice || product.price;
  const currency = product.currency || "AED";
  const productUrl = `/products/${product.slug}`;

  return (
    <Link 
      href={productUrl}
      className="flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 hover:ring-amber-200 hover:shadow-md transition-all"
    >
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

      <div
        className="mt-3 w-full rounded-full bg-amber-400 py-2.5 text-sm font-medium text-neutral-900 hover:bg-amber-500 transition-colors text-center"
      >
        Subscribe Now
      </div>

      <p className="mt-2 text-[10px] text-center text-neutral-400">
        Billed monthly on the day you subscribe
      </p>
      <p className="mt-1 text-[10px] text-center font-medium text-emerald-600">
        Free Shipping
      </p>
    </Link>
  );
}
