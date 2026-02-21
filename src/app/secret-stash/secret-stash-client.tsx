"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { PortableText } from "@portabletext/react";

type PricingTier = {
  _key: string;
  id: string;
  name: string;
  price: number;
  billingPeriod: "month" | "quarter" | "year";
  stripePriceId: string;
  savings?: string;
  isPopular?: boolean;
};

type SecretStashPageData = {
  title?: string;
  subtitle?: string;
  heading?: string;
  tagline?: string;
  gallery?: { url: string }[];
  benefits?: { _key: string; title: string; description: string }[];
  content?: any[];
  shippingNote?: string;
  currency?: string;
  pricingTiers?: PricingTier[];
  cancellationPolicy?: string;
};

type RecapItem = {
  _id: string;
  title: string;
  slug: string;
  month: string;
  shortDescription: string;
  coverImageUrl: string;
  price: number;
  currency: string;
  isAvailable: boolean;
};

type SecretStashClientProps = {
  pageData: SecretStashPageData | null;
  recapItems?: RecapItem[];
  isSignedIn: boolean;
  userEmail?: string;
  userName?: string;
};

const billingPeriodLabels: Record<string, string> = {
  month: "Monthly",
  quarter: "Quarterly",
  year: "Annual",
};

const billingPeriodDescriptions: Record<string, string> = {
  month: "per month",
  quarter: "every 3 months",
  year: "per year",
};

export default function SecretStashClient({
  pageData,
  recapItems = [],
  isSignedIn,
  userEmail,
  userName,
}: SecretStashClientProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(
    pageData?.pricingTiers?.find((t) => t.isPopular) || pageData?.pricingTiers?.[0] || null
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = pageData?.currency || "AED";
  const gallery = pageData?.gallery || [];
  const benefits = pageData?.benefits || [];
  const pricingTiers = pageData?.pricingTiers || [];

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      signIn("google", { callbackUrl: "/secret-stash" });
      return;
    }

    if (!selectedTier?.stripePriceId) {
      setError("Please select a subscription plan");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/secret-stash/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedTier.stripePriceId,
          tierId: selectedTier.id,
          tierName: selectedTier.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Default content if Sanity data not yet configured
  const defaultSubtitle = pageData?.subtitle || "SUBSCRIPTION";
  const defaultHeading = pageData?.heading || "Secret Stash Mail Club";
  const defaultTagline =
    pageData?.tagline ||
    "Once a month, members receive a carefully curated envelope filled with exclusive stationery surprises.";

  return (
    <div className="bg-[#fdf8f3] min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Column - Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200">
              {gallery.length > 0 ? (
                <Image
                  src={gallery[selectedImageIndex]?.url || ""}
                  alt="Secret Stash Mail Club"
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {gallery.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-xl transition-all ${
                      selectedImageIndex === index
                        ? "ring-2 ring-[#b08968] ring-offset-2"
                        : "ring-1 ring-neutral-200 hover:ring-neutral-300"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Content & Pricing */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#4eb8d5]">
                {defaultSubtitle}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#4eb8d5] md:text-4xl">
                {defaultHeading}
              </h1>
            </div>

            {/* Price Display */}
            {selectedTier && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#4eb8d5]">
                  {currency} {selectedTier.price.toFixed(2)}
                </span>
                <span className="text-sm text-neutral-500">
                  {billingPeriodDescriptions[selectedTier.billingPeriod]}
                </span>
              </div>
            )}

            {/* Pricing Tiers */}
            {pricingTiers.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                  Choose your plan
                </p>
                <div className="space-y-2">
                  {pricingTiers.map((tier) => (
                    <button
                      key={tier._key}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                        selectedTier?._key === tier._key
                          ? "border-[#4eb8d5] bg-[#4eb8d5]/5"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            selectedTier?._key === tier._key
                              ? "border-[#4eb8d5]"
                              : "border-neutral-300"
                          }`}
                        >
                          {selectedTier?._key === tier._key && (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#4eb8d5]" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-neutral-900">{tier.name}</span>
                          {tier.isPopular && (
                            <span className="ml-2 rounded-full bg-[#4eb8d5] px-2 py-0.5 text-[10px] font-semibold text-white">
                              POPULAR
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-neutral-900">
                          {currency} {tier.price.toFixed(2)}
                        </span>
                        {tier.savings && (
                          <span className="ml-2 text-xs font-medium text-emerald-600">
                            {tier.savings}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subscribe Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isLoading || !selectedTier}
                className="w-full rounded-full bg-[#9d7cd8] py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b6bc4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : !isSignedIn ? (
                  "Sign in to Subscribe"
                ) : (
                  "Subscribe Now"
                )}
              </button>

              {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}

              {!isSignedIn && (
                <p className="text-center text-xs text-neutral-500">
                  You'll need to sign in with Google to subscribe
                </p>
              )}
            </div>

            {/* Cancellation Policy */}
            {pageData?.cancellationPolicy && (
              <p className="text-xs text-neutral-500 leading-relaxed">
                {pageData.cancellationPolicy}
              </p>
            )}

            {/* Tagline */}
            <div className="border-t border-neutral-200 pt-6">
              <p className="text-sm text-neutral-700 leading-relaxed">{defaultTagline}</p>
            </div>

            {/* Benefits List */}
            {benefits.length > 0 && (
              <ul className="space-y-3 text-sm text-neutral-700">
                {benefits.map((benefit) => (
                  <li key={benefit._key} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#4eb8d5] flex-shrink-0" />
                    <span>
                      {benefit.title && (
                        <strong className="font-semibold text-[#4eb8d5]">{benefit.title}</strong>
                      )}{" "}
                      {benefit.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Additional Content */}
            {pageData?.content && pageData.content.length > 0 && (
              <div className="prose prose-sm prose-neutral max-w-none">
                <PortableText value={pageData.content} />
              </div>
            )}

            {/* Shipping Note */}
            {pageData?.shippingNote && (
              <div className="rounded-2xl bg-[#4eb8d5]/10 p-4">
                <p className="text-sm text-neutral-700">
                  <strong className="font-semibold">Shipping:</strong> {pageData.shippingNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recap Section */}
        {recapItems.length > 0 && (
          <div className="mt-16 border-t border-neutral-200 pt-12">
            <div className="mb-8 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9d7cd8]">
                Missed a month?
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
                Recap Collection
              </h2>
              <p className="mt-2 text-sm text-neutral-600 max-w-lg mx-auto">
                Browse our previous mail club packages. If you see something you love, 
                let us know and we'll check if it's still available!
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recapItems.map((recap) => (
                <Link
                  key={recap._id}
                  href={`/secret-stash/recap/${recap.slug}`}
                  className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md hover:ring-neutral-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {recap.coverImageUrl ? (
                      <Image
                        src={recap.coverImageUrl}
                        alt={recap.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#4eb8d5]/20 to-[#9d7cd8]/20">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    {recap.isAvailable && (
                      <div className="absolute top-3 right-3 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                        Available
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#9d7cd8]">
                      {recap.month}
                    </p>
                    <h3 className="mt-1 font-semibold text-neutral-900 group-hover:text-[#4eb8d5] transition-colors">
                      {recap.title}
                    </h3>
                    {recap.shortDescription && (
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                        {recap.shortDescription}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      {recap.price > 0 && (
                        <span className="text-sm font-semibold text-neutral-900">
                          {recap.currency} {recap.price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs font-medium text-[#4eb8d5] group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
