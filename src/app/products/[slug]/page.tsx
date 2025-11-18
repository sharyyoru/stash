import Image from "next/image";
import { notFound } from "next/navigation";
import { sanityClient } from "../../../sanity/client";
import { productBySlugQuery } from "../../../sanity/queries";
import ProductImageGallery from "../../../components/product-image-gallery";
import ProductAddToStash from "../../../components/product-add-to-stash";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await sanityClient.fetch(productBySlugQuery, {
    slug,
  });

  if (!product) {
    notFound();
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const mainImageUrl = images[0]?.url as string | undefined;

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start">
          <ProductImageGallery images={images} alt={product.title} />

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              {product.category || "Product"}
            </p>
            <h1 className="text-xl font-semibold text-neutral-900">
              {product.title}
            </h1>
            {Array.isArray(product.badges) && product.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 text-[11px]">
                {product.badges.map((badge: string) => {
                  const normalized = badge.toLowerCase().replace(/[^a-z]/g, "");
                  const isBestSeller = normalized === "bestseller";
                  const isWaterproof = normalized === "waterproof";
                  const base = "rounded-full px-2 py-0.5 font-semibold";
                  const classes = isBestSeller
                    ? `${base} border border-neutral-200 stash-rainbow-badge`
                    : isWaterproof
                    ? `${base} stash-water-badge text-white`
                    : `${base} bg-neutral-900 text-white`;
                  return (
                    <span
                      key={badge}
                      className={classes}
                    >
                      {badge}
                    </span>
                  );
                })}
              </div>
            )}

            <p className="text-lg font-semibold text-neutral-900">
              {product.currency || "AED"} {product.price}
            </p>

            {product.shortDescription && (
              <p className="text-sm text-neutral-700">
                {product.shortDescription}
              </p>
            )}

            <ProductAddToStash
              id={product._id}
              title={product.title}
              slug={product.slug}
              priceText={`${product.currency || "AED"} ${product.price ?? ""}`}
              imageUrl={mainImageUrl}
            />

            <p className="text-xs text-neutral-500">
              Ships from Dubai. Taxes and shipping calculated at checkout.
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Description
            </p>
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              {Array.isArray(product.longDescription) &&
              product.longDescription.length > 0 ? (
                product.longDescription.map((block: any, index: number) => {
                  const text = Array.isArray(block.children)
                    ? block.children.map((child: any) => child.text).join("")
                    : "";
                  if (!text) return null;
                  return <p key={index}>{text}</p>;
                })
              ) : product.shortDescription ? (
                <p>{product.shortDescription}</p>
              ) : (
                <p>More details coming soon.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Shipping & fulfillment
            </p>
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              <p>Packed with care so your stash arrives in display-ready shape.</p>
              <p>Orders ship within 3–5 business days from Dubai, UAE.</p>
              <p>Tracked shipping options available at checkout.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
