"use client";

import Image from "next/image";
import { useRef } from "react";
import Link from "next/link";
import AddToStashButton from "./add-to-stash-button";

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  label?: string;
  slug?: string;
   imageUrl?: string;
};

type ProductSliderSectionProps = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
};

export default function ProductSliderSection({
  sectionId,
  eyebrow,
  title,
  description,
  products,
}: ProductSliderSectionProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isBestSellers = sectionId === "best-sellers";
  const visibleProducts = products.slice(0, 8);
  const viewAllHref =
    sectionId === "new-in"
      ? "/just-landed"
      : sectionId === "best-sellers"
      ? "/best-sellers"
      : "/products";

  const scrollByAmount = (delta: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section id={sectionId} className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-[0.2em] ${
              isBestSellers ? "stash-rainbow-text" : "text-neutral-500"
            }`}
          >
            {eyebrow}
          </p>
          <h2
            className={`mt-2 text-lg font-semibold tracking-tight ${
              isBestSellers ? "stash-rainbow-text" : "text-neutral-900"
            }`}
          >
            {title}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={viewAllHref}
            className="hidden text-xs font-medium text-neutral-700 underline-offset-4 hover:text-neutral-900 hover:underline md:inline-flex"
          >
            View all
          </Link>
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              aria-label="Scroll products left"
              onClick={() => scrollByAmount(-260)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3 5 8l5 5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Scroll products right"
              onClick={() => scrollByAmount(260)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="-mx-4 flex gap-4 overflow-x-auto pb-2 md:mx-0 md:overflow-hidden"
      >
        {visibleProducts.map((product) => (
          <div
            key={product.id}
            className="min-w-[220px] max-w-xs flex-1 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md md:min-w-[220px]"
          >
            {product.slug ? (
              <Link
                href={`/products/${product.slug}`}
                className="block"
              >
                <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-neutral-100">
                  {product.imageUrl ? (
                    <>
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-x-2 top-2 flex items-start justify-between text-[10px] text-neutral-800">
                        <span className="rounded-full bg-white/80 px-2 py-0.5 font-medium">
                          {product.category}
                        </span>
                        {(() => {
                          const badgeLabel = isBestSellers
                            ? "Best-Seller"
                            : product.label;
                          if (!badgeLabel) return null;
                          const base =
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold";
                          const classes = isBestSellers
                            ? `${base} border border-neutral-200 stash-rainbow-badge`
                            : `${base} bg-neutral-900 text-white`;
                          return <span className={classes}>{badgeLabel}</span>;
                        })()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_55%)]" />
                      <div className="relative flex h-full flex-col justify-between p-3 text-[11px] text-neutral-600">
                        <div className="flex items-start justify-between">
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                            {product.category}
                          </span>
                          {(() => {
                            const badgeLabel = isBestSellers
                              ? "Best-Seller"
                              : product.label;
                            if (!badgeLabel) return null;
                            const base =
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold";
                            const classes = isBestSellers
                              ? `${base} border border-neutral-200 stash-rainbow-badge`
                              : `${base} bg-neutral-900 text-white`;
                            return <span className={classes}>{badgeLabel}</span>;
                          })()}
                        </div>
                        <p className="mt-auto max-w-[10rem] text-[11px] text-neutral-500">
                          Imagined product imagery placeholder.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            ) : (
              <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-neutral-100">
                {product.imageUrl ? (
                  <>
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-x-2 top-2 flex items-start justify-between text-[10px] text-neutral-800">
                      <span className="rounded-full bg-white/80 px-2 py-0.5 font-medium">
                        {product.category}
                      </span>
                      {(() => {
                        const badgeLabel = isBestSellers
                          ? "Best-Seller"
                          : product.label;
                        if (!badgeLabel) return null;
                        const base =
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold";
                        const classes = isBestSellers
                          ? `${base} border border-neutral-200 stash-rainbow-badge`
                          : `${base} bg-neutral-900 text-white`;
                        return <span className={classes}>{badgeLabel}</span>;
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_55%)]" />
                    <div className="relative flex h-full flex-col justify-between p-3 text-[11px] text-neutral-600">
                      <div className="flex items-start justify-between">
                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                          {product.category}
                        </span>
                        {(() => {
                          const badgeLabel = isBestSellers
                            ? "Best-Seller"
                            : product.label;
                          if (!badgeLabel) return null;
                          const base =
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold";
                          const classes = isBestSellers
                            ? `${base} border border-neutral-200 stash-rainbow-badge`
                            : `${base} bg-neutral-900 text-white`;
                          return <span className={classes}>{badgeLabel}</span>;
                        })()}
                      </div>
                      <p className="mt-auto max-w-[10rem] text-[11px] text-neutral-500">
                        Imagined product imagery placeholder.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-900">
                {product.slug ? (
                  <Link href={`/products/${product.slug}`}>
                    {product.name}
                  </Link>
                ) : (
                  product.name
                )}
              </p>
              <p className="text-xs text-neutral-500">{product.price}</p>
              <AddToStashButton
                id={product.id}
                title={product.name}
                slug={product.slug}
                priceText={product.price}
                imageUrl={product.imageUrl}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
