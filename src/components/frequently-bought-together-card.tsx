"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "./cart-context";

const MAIL_CLUB_SLUG = "the-secret-stash-mail-club";

export type FrequentlyBoughtProduct = {
  id: string;
  title: string;
  slug?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
};

type FrequentlyBoughtTogetherCardProps = {
  products: FrequentlyBoughtProduct[];
};

export default function FrequentlyBoughtTogetherCard({
  products,
}: FrequentlyBoughtTogetherCardProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  if (!Array.isArray(products) || products.length < 2) {
    return null;
  }

  const primaryCurrency =
    products.find((p) => typeof p.currency === "string" && p.currency)?.currency ||
    "AED";

  const totalAmount = products.reduce((sum, product) => {
    const price = typeof product.price === "number" ? product.price : 0;
    if (!Number.isFinite(price) || price <= 0) {
      return sum;
    }
    return sum + price;
  }, 0);

  const formattedTotal = `${primaryCurrency} ${
    Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount.toFixed(2) : ""
  }`;

  const handleAddBundle = () => {
    let hadError = false;

    const bundleHasMailClub = products.some((p) => p.slug === MAIL_CLUB_SLUG);
    const bundleHasOther = products.some((p) => p.slug !== MAIL_CLUB_SLUG);
    if (bundleHasMailClub && bundleHasOther) {
      setBundleError("The Secret Stash Mail Club must be purchased alone.");
      window.setTimeout(() => setBundleError(null), 2500);
      return;
    }

    products.forEach((product) => {
      if (!product.id) return;
      const priceText = `${product.currency || primaryCurrency} ${
        typeof product.price === "number" ? product.price : ""
      }`;
      const ok = addItem(
        {
          id: product.id,
          title: product.title,
          slug: product.slug,
          priceText,
          imageUrl: product.imageUrl,
        },
        1,
      );
      if (!ok) {
        setBundleError("The Secret Stash Mail Club must be purchased alone.");
        window.setTimeout(() => setBundleError(null), 2500);
        hadError = true;
      }
    });
    if (!hadError) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 900);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-100 space-y-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        Frequently bought together
      </p>
      <div className="space-y-3 text-sm text-neutral-800">
        {products.map((product, index) => (
          <div key={product.id || index} className="flex items-center gap-3">
            {product.imageUrl ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-neutral-100">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-[10px] text-neutral-500">
                +
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs font-medium text-neutral-900 line-clamp-2">
                {product.title}
              </p>
              <p className="text-[11px] text-neutral-500">
                {product.currency || primaryCurrency} {product.price ?? ""}
              </p>
            </div>
            {index < products.length - 1 && (
              <span className="px-1 text-xs text-neutral-400">+</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-4">
        <div>
          <p className="text-[11px] text-neutral-500">Bundle total</p>
          <p className="text-sm font-semibold text-neutral-900">{formattedTotal}</p>
        </div>
        <button
          type="button"
          onClick={handleAddBundle}
          className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800"
        >
          {justAdded ? "Bundle added" : "Add bundle to stash"}
        </button>
      </div>

      {bundleError && (
        <p className="text-[11px] text-amber-700">
          {bundleError}
        </p>
      )}
    </div>
  );
}
