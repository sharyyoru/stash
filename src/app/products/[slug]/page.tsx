import { notFound } from "next/navigation";
import { sanityClient } from "../../../sanity/client";
import { productBySlugQuery } from "../../../sanity/queries";
import ProductTopSection from "../../../components/product-top-section";

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
  const variants = Array.isArray(product.variants)
    ? (product.variants as any[]).map((v) => ({
        id: v._key,
        name: v.name,
        price: v.price,
        images: Array.isArray(v.images) ? v.images : [],
      }))
    : [];

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <ProductTopSection
          id={product._id}
          title={product.title}
          slug={product.slug}
          category={product.category}
          badges={Array.isArray(product.badges) ? product.badges : []}
          shortDescription={product.shortDescription}
          currency={product.currency}
          price={product.price}
          images={images}
          variants={variants}
        />

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
