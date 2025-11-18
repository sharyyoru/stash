"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sanityClient } from "../sanity/client";
import { searchProductsQuery } from "../sanity/queries";

type SearchSuggestion = {
  _id: string;
  slug?: string;
  title: string;
  price?: number;
  currency?: string;
  category?: string;
  imageUrl?: string;
};

type SearchButtonProps = {
  suggestions: SearchSuggestion[];
};

export default function SearchButton({ suggestions }: SearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setIsSearching(false);
  };

  const visibleSuggestions = Array.isArray(suggestions)
    ? suggestions.slice(0, 4)
    : [];

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      sanityClient
        .fetch<SearchSuggestion[]>(searchProductsQuery, {
          term: `${trimmed}*`,
        })
        .then((res) => {
          if (cancelled) return;
          setResults(Array.isArray(res) ? res : []);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
        })
        .finally(() => {
          if (cancelled) return;
          setIsSearching(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Search</span>
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="m15.5 15.5 3 3" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24">
          <div className="w-full max-w-xl rounded-3xl bg-white p-4 shadow-lg ring-1 ring-neutral-200">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your stash…"
                className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
              />
              <button
                type="button"
                onClick={close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                aria-label="Close search"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                {query.trim() ? "Results" : "Just landed"}
              </p>
              {query.trim() ? (
                <div className="space-y-2">
                  {isSearching && (
                    <p className="text-xs text-neutral-500">Searching…</p>
                  )}
                  {!isSearching && results.length === 0 && (
                    <p className="text-xs text-neutral-500">
                      No products match that yet. Try a different name or character.
                    </p>
                  )}
                  {results.map((product) => (
                    <Link
                      key={product._id}
                      href={product.slug ? `/products/${product.slug}` : "#"}
                      className="flex items-center gap-3 rounded-2xl p-2 hover:bg-neutral-50"
                      onClick={close}
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-neutral-100">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                            Preview
                          </div>
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                          {product.category || "Product"}
                        </p>
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {product.title}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {product.currency || "AED"}
                          {typeof product.price === "number" ? ` ${product.price}` : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : visibleSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {visibleSuggestions.map((product) => (
                    <Link
                      key={product._id}
                      href={product.slug ? `/products/${product.slug}` : "#"}
                      className="flex items-center gap-3 rounded-2xl p-2 hover:bg-neutral-50"
                      onClick={close}
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-neutral-100">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                            Preview
                          </div>
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                          {product.category || "Product"}
                        </p>
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {product.title}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {product.currency || "AED"}
                          {typeof product.price === "number" ? ` ${product.price}` : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  No products yet. Add a few items in Sanity to see Just landed suggestions here.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
