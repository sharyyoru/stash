import { sanityClient } from "../../sanity/client";
import { shippingPageQuery } from "../../sanity/queries";
import { PortableText } from "@portabletext/react";
import Link from "next/link";

export const metadata = {
  title: "Shipping & Returns | Stash",
  description: "Learn about our shipping policies and return process.",
};

export default async function ShippingPage() {
  const page = await sanityClient.fetch(shippingPageQuery).catch(() => null);

  const heading = page?.heading || "Shipping & Returns";
  const content = page?.content;

  // Default content if nothing in Sanity
  const defaultContent = [
    {
      heading: "Shipping",
      items: [
        "Free shipping on orders over AED 200 within the UAE",
        "Standard delivery: 3-5 business days",
        "Express delivery available at checkout",
        "Orders are processed within 1-2 business days",
      ],
    },
    {
      heading: "Returns",
      items: [
        "Returns accepted within 14 days of delivery",
        "Items must be unused and in original packaging",
        "Contact us to initiate a return",
        "Refunds processed within 5-7 business days",
      ],
    },
  ];

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Policies
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">{heading}</h1>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
          {content && content.length > 0 ? (
            <div className="prose prose-sm prose-neutral max-w-none prose-headings:text-neutral-900 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-p:text-neutral-600 prose-li:text-neutral-600">
              <PortableText value={content} />
            </div>
          ) : (
            <div className="space-y-8">
              {defaultContent.map((section) => (
                <div key={section.heading}>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                    {section.heading}
                  </h2>
                  <ul className="space-y-2">
                    {section.items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f3b560]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
