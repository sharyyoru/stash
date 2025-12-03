import { sanityClient } from "../../sanity/client";
import { termsPageQuery } from "../../sanity/queries";
import { PortableText } from "@portabletext/react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | Stash",
  description: "Terms and conditions for using Stash.",
};

export default async function TermsPage() {
  const page = await sanityClient.fetch(termsPageQuery).catch(() => null);

  const heading = page?.heading || "Terms & Conditions";
  const lastUpdated = page?.lastUpdated;
  const content = page?.content;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Legal
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">{heading}</h1>
          {lastUpdated && (
            <p className="text-xs text-neutral-500">
              Last updated: {new Date(lastUpdated).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
          {content && content.length > 0 ? (
            <div className="prose prose-sm prose-neutral max-w-none prose-headings:text-neutral-900 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-p:text-neutral-600 prose-li:text-neutral-600">
              <PortableText value={content} />
            </div>
          ) : (
            <div className="space-y-6 text-sm text-neutral-600">
              <p>
                By using the Stash website and making purchases, you agree to the following
                terms and conditions.
              </p>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Orders & Payment</h2>
                <p>
                  All orders are subject to availability. Prices are in AED and include applicable
                  taxes unless otherwise stated. Payment is required at the time of order.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Intellectual Property</h2>
                <p>
                  All designs, images, and content on this website are the property of Stash
                  and may not be reproduced without permission.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Limitation of Liability</h2>
                <p>
                  Stash is not liable for any indirect, incidental, or consequential damages
                  arising from the use of our products or services.
                </p>
              </div>

              <p className="text-xs text-neutral-400 pt-4 border-t border-neutral-100">
                This is placeholder content. Edit this page in Sanity Studio.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-500 transition hover:text-[#b08968]"
          >
            ← Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
