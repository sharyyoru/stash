import { notFound } from "next/navigation";
import { sanityClient } from "../../../sanity/client";
import {
  bestSellerProductsQuery,
  productBySlugQuery,
  recommendedProductsByCategoryQuery,
} from "../../../sanity/queries";
import ProductTopSection from "../../../components/product-top-section";
import ProductSliderSection from "../../../components/product-section-slider";
import FrequentlyBoughtTogetherCard, {
  FrequentlyBoughtProduct,
} from "../../../components/frequently-bought-together-card";

const MAIL_CLUB_SLUG = "the-secret-stash-mail-club";

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

  const descriptionParagraphs: string[] = [];

  if (Array.isArray(product.longDescription) && product.longDescription.length > 0) {
    product.longDescription.forEach((block: any) => {
      const text = Array.isArray(block.children)
        ? block.children.map((child: any) => child.text).join("")
        : "";
      if (text) {
        descriptionParagraphs.push(text);
      }
    });
  } else if (product.shortDescription) {
    descriptionParagraphs.push(product.shortDescription as string);
  } else {
    descriptionParagraphs.push("More details coming soon.");
  }

  const [recommendedRaw, bestSellersRaw] = await Promise.all([
    product.categorySlug
      ? sanityClient
          .fetch(recommendedProductsByCategoryQuery, {
            categorySlug: product.categorySlug,
            currentSlug: product.slug,
          })
          .catch(() => [])
      : Promise.resolve([]),
    sanityClient.fetch(bestSellerProductsQuery).catch(() => []),
  ]);

  type SliderProduct = {
    id: string;
    name: string;
    category: string;
    price: string;
    label?: string;
    slug?: string;
    imageUrl?: string;
  };

  const mapSanityProductToSliderProduct = (p: any): SliderProduct => ({
    id: p._id,
    name: p.title,
    category: p.category || product.category || "Stash",
    price: `${p.currency || "AED"} ${p.price ?? ""}`,
    label:
      Array.isArray(p.badges) && p.badges.length > 0 ? (p.badges[0] as string) : undefined,
    slug: p.slug,
    imageUrl: p.imageUrl,
  });

  const recommendedProducts: SliderProduct[] = Array.isArray(recommendedRaw)
    ? (recommendedRaw as any[]).map(mapSanityProductToSliderProduct)
    : [];

  const bestSellersForBundle = Array.isArray(bestSellersRaw)
    ? (bestSellersRaw as any[])
        .filter((p) => p.slug !== product.slug)
        .slice(0, 2)
    : [];

  const bundleProducts: FrequentlyBoughtProduct[] = [
    {
      id: product._id as string,
      title: product.title as string,
      slug: product.slug as string | undefined,
      price: product.price as number | undefined,
      currency: product.currency as string | undefined,
      imageUrl: mainImageUrl,
    },
    ...bestSellersForBundle.map((p: any) => ({
      id: p._id as string,
      title: p.title as string,
      slug: p.slug as string | undefined,
      price: p.price as number | undefined,
      currency: p.currency as string | undefined,
      imageUrl: p.imageUrl as string | undefined,
    })),
  ];

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
          descriptionParagraphs={descriptionParagraphs}
          isSubscription={product.isSubscription || product.isSubscriptionCategory}
          subscriptionPrice={product.subscriptionPrice}
        />

        <section className="grid gap-4 md:grid-cols-2">
          {bundleProducts.length >= 2 && (
            <FrequentlyBoughtTogetherCard products={bundleProducts} />
          )}

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Shipping & fulfillment
            </p>
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              <p>Packed with care so your stash arrives in display-ready shape.</p>
              <p>Orders ship within 3–5 business days from Dubai, UAE.</p>
              {slug === MAIL_CLUB_SLUG ? (
                <>
                  <p>International shipping is available for the Mail Club.</p>
                  <p className="pt-2 border-t border-neutral-100 font-medium text-neutral-900">
                    Delivery charge: Free (Mail Club only)
                  </p>
                </>
              ) : (
                <>
                  <p>UAE delivery only. International shipping is available for the Mail Club.</p>
                  <p className="pt-2 border-t border-neutral-100 font-medium text-neutral-900">
                    Delivery charge: AED 25 (UAE)
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {recommendedProducts.length > 0 && (
          <ProductSliderSection
            sectionId="recommended"
            eyebrow="You might also like"
            title="Recommended for you"
            description="More pieces from this corner of the shop."
            products={recommendedProducts}
          />
        )}
      </div>
    </div>
  );
}
