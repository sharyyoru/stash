"use client";

import { useState } from "react";
import ProductImageGallery from "./product-image-gallery";
import ProductAddToStash from "./product-add-to-stash";

const MAIL_CLUB_SLUG = "the-secret-stash-mail-club";

type ProductImage = {
  url?: string;
};

type VariantOption = {
  id: string;
  name: string;
  price?: number;
  images?: ProductImage[];
};

type ProductTopSectionProps = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  badges?: string[];
  shortDescription?: string;
  currency?: string;
  price?: number;
  images: ProductImage[];
  variants?: VariantOption[];
  descriptionParagraphs?: string[];
};

export default function ProductTopSection({
  id,
  title,
  slug,
  category,
  badges,
  shortDescription,
  currency,
  price,
  images,
  variants,
  descriptionParagraphs,
}: ProductTopSectionProps) {
  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const initialVariant = hasVariants ? variants![0] : null;

  const [selectedVariantForImages, setSelectedVariantForImages] =
    useState<VariantOption | null>(initialVariant);

  const imagesForGallery =
    selectedVariantForImages &&
    Array.isArray(selectedVariantForImages.images) &&
    selectedVariantForImages.images.length > 0
      ? selectedVariantForImages.images
      : images;

  const basePriceText = `${currency || "AED"} ${price ?? ""}`;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start">
      <ProductImageGallery images={imagesForGallery} alt={title} />

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          {category || "Product"}
        </p>
        <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
        {Array.isArray(badges) && badges.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {badges.map((badge) => {
              const normalized = badge.toLowerCase().replace(/[^a-z]/g, "");
              const isBestSeller = normalized === "bestseller";
              const isWaterproof = normalized === "waterproof";
              const base = "rounded-full px-2 py-0.5 font-semibold";
              const classes = isBestSeller
                ? `${base} border border-neutral-200 stash-rainbow-badge`
                : isWaterproof
                ? `${base} stash-water-badge text-white`
                : `${base} bg-neutral-900 text-white`;
              return (
                <span key={badge} className={classes}>
                  {badge}
                </span>
              );
            })}
          </div>
        )}

        {shortDescription && (
          <p className="text-sm text-neutral-700">{shortDescription}</p>
        )}

        <ProductAddToStash
          id={id}
          title={title}
          slug={slug}
          priceText={basePriceText}
          imageUrl={imagesForGallery[0]?.url}
          currency={currency}
          badges={badges}
          variants={variants}
          onVariantChange={setSelectedVariantForImages}
        />

        <p className="text-xs text-neutral-500">
          {slug === MAIL_CLUB_SLUG
            ? "Ships from Dubai. International shipping is available for the Mail Club."
            : "Ships from Dubai. UAE shipping only — international shipping is available for the Mail Club."}
        </p>

        {Array.isArray(descriptionParagraphs) &&
          descriptionParagraphs.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Description
              </p>
              <div className="mt-3 space-y-2 text-sm text-neutral-700">
                {descriptionParagraphs.map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
