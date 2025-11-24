"use client";

import { useState } from "react";
import AddToStashButton from "./add-to-stash-button";

type VariantOption = {
  id: string;
  name: string;
  price?: number;
  images?: { url?: string }[];
};

type ProductAddToStashProps = {
  id: string;
  title: string;
  slug?: string;
  priceText?: string;
  imageUrl?: string;
  currency?: string;
  variants?: VariantOption[];
  onVariantChange?: (variant: VariantOption | null) => void;
};

export default function ProductAddToStash({
  id,
  title,
  slug,
  priceText,
  imageUrl,
  currency,
  variants,
  onVariantChange,
}: ProductAddToStashProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants && variants.length > 0 ? variants[0].id : null,
  );

  const handleChange = (value: string) => {
    const num = Number(value);
    if (Number.isNaN(num) || num <= 0) {
      setQuantity(1);
    } else {
      setQuantity(Math.floor(num));
    }
  };

  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const selectedVariant = hasVariants
    ? variants?.find((v) => v.id === selectedVariantId) || variants![0]
    : null;

  const computedPriceText =
    selectedVariant && typeof selectedVariant.price === "number"
      ? `${currency || "AED"} ${selectedVariant.price}`
      : priceText;

  const displayPriceText =
    computedPriceText || "Price will be confirmed at checkout.";

  const cartId = selectedVariant ? `${id}::${selectedVariant.id}` : id;
  const cartTitle = selectedVariant
    ? `${title} ႓ ${selectedVariant.name}`
    : title;

  const effectiveImageUrl =
    selectedVariant && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
      ? selectedVariant.images[0]?.url || imageUrl
      : imageUrl;

  return (
    <div className="space-y-3 pt-2">
      <p className="text-lg font-semibold text-neutral-900">
        {displayPriceText}
      </p>

      {hasVariants && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-neutral-700">Choose a variant</p>
          <div className="flex flex-wrap gap-2">
            {variants!.map((variant) => {
              const isActive = variant.id === selectedVariant?.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    onVariantChange?.(variant);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 shadow-sm">
          <label
            className="mr-2 text-xs text-neutral-500"
            htmlFor="quantity"
          >
            Qty
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => handleChange(e.target.value)}
            className="w-14 border-0 bg-transparent text-sm text-neutral-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <AddToStashButton
          id={cartId}
          title={cartTitle}
          slug={slug}
          priceText={computedPriceText}
          imageUrl={effectiveImageUrl}
          quantity={quantity}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
        >
          Add to stash
        </AddToStashButton>
      </div>
    </div>
  );
}
