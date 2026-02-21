"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { PortableText } from "@portabletext/react";

type RecapItemData = {
  _id: string;
  title: string;
  slug: string;
  month: string;
  shortDescription: string;
  coverImageUrl: string;
  gallery?: { url: string }[];
  contents?: { _key: string; name: string; description: string }[];
  longDescription?: any[];
  price: number;
  currency: string;
  isAvailable: boolean;
  publishedAt: string;
};

type RecapItemClientProps = {
  recapItem: RecapItemData;
  isSignedIn: boolean;
  userEmail?: string;
  userName?: string;
};

export default function RecapItemClient({
  recapItem,
  isSignedIn,
  userEmail,
  userName,
}: RecapItemClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: userName || "",
    email: userEmail || "",
    message: "",
  });

  const allImages = [
    ...(recapItem.coverImageUrl ? [{ url: recapItem.coverImageUrl }] : []),
    ...(recapItem.gallery || []),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      signIn("google", { callbackUrl: `/secret-stash/recap/${recapItem.slug}` });
      return;
    }

    setIsSubmitting(true);
    setFormStatus("idle");

    try {
      const response = await fetch("/api/secret-stash/recap-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recapId: recapItem._id,
          recapTitle: recapItem.title,
          recapMonth: recapItem.month,
          recapPrice: recapItem.price,
          recapCurrency: recapItem.currency,
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setFormStatus("success");
      setFormData((prev) => ({ ...prev, message: "" }));
    } catch (error) {
      setFormStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fdf8f3] min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-neutral-500">
            <li>
              <Link href="/secret-stash" className="hover:text-neutral-900 transition-colors">
                Secret Stash
              </Link>
            </li>
            <li>/</li>
            <li className="text-neutral-900 font-medium">{recapItem.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Column - Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200">
              {allImages.length > 0 ? (
                <Image
                  src={allImages[selectedImageIndex]?.url || ""}
                  alt={recapItem.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#4eb8d5]/20 to-[#9d7cd8]/20">
                  <span className="text-6xl">📦</span>
                </div>
              )}
              {recapItem.isAvailable && (
                <div className="absolute top-4 right-4 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                  Available
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-xl transition-all ${
                      selectedImageIndex === index
                        ? "ring-2 ring-[#9d7cd8] ring-offset-2"
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

          {/* Right Column - Content & Interest Form */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9d7cd8]">
                {recapItem.month} Recap
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                {recapItem.title}
              </h1>
            </div>

            {/* Price */}
            {recapItem.price > 0 && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#4eb8d5]">
                  {recapItem.currency} {recapItem.price.toFixed(2)}
                </span>
              </div>
            )}

            {/* Description */}
            {recapItem.shortDescription && (
              <p className="text-neutral-700 leading-relaxed">
                {recapItem.shortDescription}
              </p>
            )}

            {/* What's Included */}
            {recapItem.contents && recapItem.contents.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  What's Included
                </h2>
                <ul className="space-y-2">
                  {recapItem.contents.map((item) => (
                    <li key={item._key} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#9d7cd8] flex-shrink-0" />
                      <div>
                        <strong className="font-medium text-neutral-900">{item.name}</strong>
                        {item.description && (
                          <span className="text-neutral-500"> — {item.description}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Long Description */}
            {recapItem.longDescription && recapItem.longDescription.length > 0 && (
              <div className="prose prose-sm prose-neutral max-w-none">
                <PortableText value={recapItem.longDescription} />
              </div>
            )}

            {/* Interest Form */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <div className="space-y-1 mb-4">
                <h2 className="font-semibold text-neutral-900">Interested in this recap?</h2>
                <p className="text-xs text-neutral-500">
                  Let us know and we'll check availability for you.
                </p>
              </div>

              {formStatus === "success" ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  <p className="font-medium">Thank you for your interest!</p>
                  <p className="mt-1 text-emerald-600">
                    We've received your request and will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-xs font-medium text-neutral-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-[#9d7cd8] focus:outline-none focus:ring-1 focus:ring-[#9d7cd8]"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium text-neutral-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-[#9d7cd8] focus:outline-none focus:ring-1 focus:ring-[#9d7cd8]"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-xs font-medium text-neutral-700 mb-1">
                      Message (optional)
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-[#9d7cd8] focus:outline-none focus:ring-1 focus:ring-[#9d7cd8] resize-none"
                      placeholder="Any specific questions or requests..."
                    />
                  </div>

                  {formStatus === "error" && (
                    <p className="text-sm text-red-600">
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-[#9d7cd8] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b6bc4] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </span>
                    ) : !isSignedIn ? (
                      "Sign in to Express Interest"
                    ) : (
                      "I'm Interested!"
                    )}
                  </button>

                  {!isSignedIn && (
                    <p className="text-center text-xs text-neutral-500">
                      You'll need to sign in with Google to submit
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Back Link */}
            <Link
              href="/secret-stash"
              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Secret Stash
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
