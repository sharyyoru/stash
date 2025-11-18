"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import AddToStashButton from "./add-to-stash-button";

type ProductSummary = {
  _id: string;
  slug?: string;
  title: string;
  price?: number;
  currency?: string;
  shortDescription?: string;
  category?: string;
  badges?: string[];
  imageUrl?: string;
  characterName?: string;
  characterSlug?: string;
};

type AllProductsGridProps = {
  products: ProductSummary[];
  showBadgeFilter?: boolean;
};

export default function AllProductsGrid({
  products,
  showBadgeFilter = true,
}: AllProductsGridProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [badgeFilter, setBadgeFilter] = useState<string>("all");
  const [characterFilter, setCharacterFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<
    "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc"
  >("newest");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const characters = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.characterName) set.add(p.characterName);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const badges = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (Array.isArray(p.badges)) {
        for (const badge of p.badges) {
          set.add(badge);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    let result = products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }

      if (
        badgeFilter !== "all" &&
        (!Array.isArray(p.badges) || !p.badges.includes(badgeFilter))
      ) {
        return false;
      }

      if (characterFilter !== "all" && p.characterName !== characterFilter) {
        return false;
      }

      if (typeof p.price === "number") {
        if (min !== undefined && p.price < min) return false;
        if (max !== undefined && p.price > max) return false;
      }

      return true;
    });

    result = result.slice();

    result.sort((a, b) => {
      if (sort === "name-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sort === "name-desc") {
        return b.title.localeCompare(a.title);
      }
      if (sort === "price-asc" || sort === "price-desc") {
        const pa = typeof a.price === "number" ? a.price : Infinity;
        const pb = typeof b.price === "number" ? b.price : Infinity;
        if (pa === pb) return 0;
        return sort === "price-asc" ? pa - pb : pb - pa;
      }
      // newest: keep the original order from the query (createdAt desc)
      return 0;
    });

    return result;
  }, [
    products,
    categoryFilter,
    badgeFilter,
    minPrice,
    maxPrice,
    sort,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1 min-w-[140px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Category
              </p>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="stash-select h-9 rounded-full border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              >
                <option value="all">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {showBadgeFilter && (
              <div className="space-y-1 min-w-[140px]">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Badge
                </p>
                <select
                  value={badgeFilter}
                  onChange={(e) => setBadgeFilter(e.target.value)}
                  className="stash-select h-9 rounded-full border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                >
                  <option value="all">All badges</option>
                  {badges.map((badge) => (
                    <option key={badge} value={badge}>
                      {badge}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1 min-w-[140px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Character
              </p>
              <select
                value={characterFilter}
                onChange={(e) => setCharacterFilter(e.target.value)}
                className="stash-select h-9 rounded-full border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              >
                <option value="all">All characters</option>
                {characters.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 min-w-[170px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Price
              </p>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="h-9 w-20 rounded-full border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
                <span className="text-neutral-400">–</span>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="h-9 w-20 rounded-full border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Sort by
          </p>
          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as AllProductsGridProps["products"] extends never
                ? never
                : any)
            }
            className="stash-select h-9 rounded-full border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((product) => (
            <div
              key={product._id}
              className="flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link
                href={product.slug ? `/products/${product.slug}` : "#"}
                className="block"
              >
                <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-neutral-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
                    Product imagery coming soon.
                  </div>
                )}
                </div>
              </Link>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {product.category || "Product"}
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {product.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {product.currency || "AED"} {product.price}
                </p>
                {Array.isArray(product.badges) && product.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                    {product.badges.map((badge) => {
                      const normalized = badge.toLowerCase().replace(/[^a-z]/g, "");
                      const isBestSeller = normalized === "bestseller";
                      const isWaterproof = normalized === "waterproof";
                      const base = "rounded-full px-2 py-0.5 font-medium";
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
                <AddToStashButton
                  id={product._id}
                  title={product.title}
                  slug={product.slug}
                  priceText={`${product.currency || "AED"} ${product.price ?? ""}`}
                  imageUrl={product.imageUrl}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-600">
            No products match these filters. Try clearing some filters.
          </p>
        )}
      </div>
    </div>
  );
}
