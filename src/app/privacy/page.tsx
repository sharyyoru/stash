import { sanityClient } from "../../sanity/client";
import { privacyPageQuery } from "../../sanity/queries";
import { PortableText } from "@portabletext/react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Stash",
  description: "Our privacy policy and how we handle your data.",
};

export default async function PrivacyPage() {
  const page = await sanityClient.fetch(privacyPageQuery).catch(() => null);

  const heading = page?.heading || "Privacy Policy";
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
                At Stash, we take your privacy seriously. This policy explains how we collect,
                use, and protect your personal information.
              </p>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Information We Collect</h2>
                <p>
                  We collect information you provide when placing orders, including your name,
                  email, shipping address, and payment details.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">How We Use Your Information</h2>
                <p>
                  Your information is used to process orders, provide customer support, and
                  improve our services. We do not sell your data to third parties.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Contact Us</h2>
                <p>
                  If you have questions about our privacy practices, please contact us.
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
