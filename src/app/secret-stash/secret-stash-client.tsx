"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { PortableText } from "@portabletext/react";
import { SubscriptionSchema } from "../../components/json-ld-schema";

type PricingTier = {
  _key: string;
  id: string;
  name: string;
  price: number;
  billingPeriod: "month" | "quarter" | "half-year" | "year";
  stripePriceId: string;
  savings?: string;
  isPopular?: boolean;
};

type SecretStashPageData = {
  title?: string;
  subtitle?: string;
  heading?: string;
  tagline?: any[];
  gallery?: { url: string }[];
  benefits?: { _key: string; title: string; description: string }[];
  content?: any[];
  shippingNote?: any[];
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
  "half-year": "6 Months",
  year: "Annual",
};

const billingPeriodDescriptions: Record<string, string> = {
  month: "per month",
  quarter: "every 3 months",
  "half-year": "every 6 months",
  year: "per year",
};

const billingPeriodMonths: Record<string, number> = {
  month: 1,
  quarter: 3,
  "half-year": 6,
  year: 12,
};

// Calculate monthly equivalent price for display
function getMonthlyPrice(price: number, period: string): number {
  const months = billingPeriodMonths[period] || 1;
  return price / months;
}

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
        // Show detailed error for debugging
        const errorMsg = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || "Failed to create checkout session";
        throw new Error(errorMsg);
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
  const defaultTaglineText = "Once a month, members receive a carefully curated envelope filled with exclusive stationery surprises. All packages are shipped on the 20th of each month.";

  // Get the first gallery image for schema
  const schemaImageUrl = gallery.length > 0 ? gallery[0].url : undefined;
  const schemaBenefits = benefits.map((b) => `${b.title}: ${b.description}`);

  return (
    <div className="bg-[#fdf8f3] min-h-screen">
      {/* JSON-LD Schema for Subscription SEO */}
      {selectedTier && (
        <SubscriptionSchema
          subscription={{
            name: `Secret Stash Mail Club - ${selectedTier.name}`,
            description: "Premium monthly stationery subscription box with exclusive art prints, original stories, and curated surprises delivered to your door.",
            price: selectedTier.price,
            currency: currency,
            billingPeriod: selectedTier.billingPeriod,
            imageUrl: schemaImageUrl,
            benefits: schemaBenefits,
          }}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Column - Gallery (Sticky on Desktop) */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
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

            {/* Pricing Tiers - Enhanced UI */}
            {pricingTiers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                    Choose your plan
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Cancel anytime</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pricingTiers.map((tier) => {
                    const monthlyPrice = getMonthlyPrice(tier.price, tier.billingPeriod);
                    const isSelected = selectedTier?._key === tier._key;
                    const months = billingPeriodMonths[tier.billingPeriod] || 1;
                    
                    return (
                      <button
                        key={tier._key}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-[#4eb8d5] bg-gradient-to-br from-[#4eb8d5]/5 to-[#9d7cd8]/5 shadow-lg shadow-[#4eb8d5]/10"
                            : "border-neutral-200 bg-white hover:border-[#4eb8d5]/50 hover:shadow-md"
                        }`}
                      >
                        {/* Popular Badge */}
                        {tier.isPopular && (
                          <div className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-[#4eb8d5] to-[#9d7cd8] px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            MOST POPULAR
                          </div>
                        )}
                        
                        {/* Savings Badge */}
                        {tier.savings && (
                          <div className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            {tier.savings}
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between pt-1">
                          <div>
                            <span className="font-semibold text-neutral-900">{tier.name}</span>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {billingPeriodDescriptions[tier.billingPeriod]}
                            </p>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? "border-[#4eb8d5] bg-[#4eb8d5]" : "border-neutral-300"
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 border-t border-neutral-100 pt-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-[#4eb8d5]">
                              {currency} {tier.price.toFixed(0)}
                            </span>
                            {months > 1 && (
                              <span className="text-xs text-neutral-400">
                                ({currency} {monthlyPrice.toFixed(0)}/mo)
                              </span>
                            )}
                          </div>
                          {months > 1 && (
                            <p className="mt-1 text-xs text-neutral-500">
                              Billed as one payment for {months} months
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-neutral-500">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-[#4eb8d5]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>Ships on the 20th</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-[#9d7cd8]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span>Curated with love</span>
                  </div>
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
              {pageData?.tagline && pageData.tagline.length > 0 ? (
                <div className="prose prose-sm prose-neutral max-w-none [&>p]:text-neutral-700 [&>p]:leading-relaxed [&>p]:mb-4 [&>p:last-child]:mb-0 [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:mt-4 [&>h3]:mb-2 [&>h4]:mt-3 [&>h4]:mb-1 [&_strong]:font-semibold">
                  <PortableText value={pageData.tagline} />
                </div>
              ) : (
                <p className="text-sm text-neutral-700 leading-relaxed">{defaultTaglineText}</p>
              )}
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
              <div className="prose prose-sm prose-neutral max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:mt-4 [&>h3]:mb-2 [&>h4]:mt-3 [&>h4]:mb-1 [&_strong]:font-semibold">
                <PortableText value={pageData.content} />
              </div>
            )}

            {/* Shipping Note */}
            {pageData?.shippingNote && pageData.shippingNote.length > 0 && (
              <div className="rounded-2xl bg-[#4eb8d5]/10 p-4">
                <div className="text-sm text-neutral-700 [&>p]:mb-0 [&_strong]:font-semibold">
                  <PortableText value={pageData.shippingNote} />
                </div>
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
