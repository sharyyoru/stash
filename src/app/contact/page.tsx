import { sanityClient } from "../../sanity/client";
import { contactPageQuery } from "../../sanity/queries";
import { PortableText } from "@portabletext/react";
import Link from "next/link";

export const metadata = {
  title: "Contact | Stash",
  description: "Get in touch with Stash. We'd love to hear from you.",
};

export default async function ContactPage() {
  const page = await sanityClient.fetch(contactPageQuery).catch(() => null);

  const heading = page?.heading || "Get in Touch";
  const subheading = page?.subheading || "We'd love to hear from you. Reach out anytime!";
  const email = page?.email || "hello@s-tash.store";
  const whatsapp = page?.whatsapp;
  const instagram = page?.instagram;
  const content = page?.content;

  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Support
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">{heading}</h1>
          <p className="text-sm text-neutral-600">{subheading}</p>
        </div>

        <div className="mt-10 space-y-4">
          {/* Email */}
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition hover:ring-neutral-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff3c4] text-[#b08968]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Email</p>
              <p className="text-sm font-semibold text-neutral-900">{email}</p>
            </div>
          </a>

          {/* WhatsApp */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition hover:ring-neutral-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">WhatsApp</p>
                <p className="text-sm font-semibold text-neutral-900">{whatsapp}</p>
              </div>
            </a>
          )}

          {/* Instagram */}
          {instagram && (
            <a
              href={`https://instagram.com/${instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition hover:ring-neutral-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-pink-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="0.8" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">Instagram</p>
                <p className="text-sm font-semibold text-neutral-900">{instagram}</p>
              </div>
            </a>
          )}
        </div>

        {/* Additional content from Sanity */}
        {content && content.length > 0 && (
          <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
            <div className="prose prose-sm prose-neutral max-w-none">
              <PortableText value={content} />
            </div>
          </div>
        )}

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
