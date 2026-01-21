import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "../../../sanity/client";
import AllProductsGrid from "../../../components/all-products-grid";
import SubscriptionProductGrid from "../../../components/subscription-product-grid";
import {
  categoryBySlugQuery,
  productsByCategoryQuery,
  stickerBadgeProductsQuery,
  lifestyleBadgeProductsQuery,
} from "../../../sanity/queries";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const isStickers = slug === "stickers";
  const isLifestyle = slug === "lifestyle";
  const isBadgePage = isStickers || isLifestyle;

  const getProductsQuery = () => {
    if (isStickers) return sanityClient.fetch(stickerBadgeProductsQuery);
    if (isLifestyle) return sanityClient.fetch(lifestyleBadgeProductsQuery);
    return sanityClient.fetch(productsByCategoryQuery, { slug });
  };

  const [category, products] = await Promise.all([
    sanityClient.fetch(categoryBySlugQuery, { slug }).catch(() => null),
    getProductsQuery().catch(() => []),
  ]);

  const safeCategory =
    category ||
    (isStickers
      ? {
          title: "Stickers",
          description: 'All products tagged with the "Sticker" badge.',
          heroImageUrl: null,
        }
      : isLifestyle
      ? {
          title: "Lifestyle",
          description: 'All products tagged with the "Lifestyle" badge.',
          heroImageUrl: null,
        }
      : null);

  if (!safeCategory) {
    notFound();
  }

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr] items-center">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              {isBadgePage ? "Collection" : "Category"}
            </p>
            <h1 className="text-xl font-semibold text-neutral-900">{safeCategory.title}</h1>
            {safeCategory.description && (
              <p className="text-sm text-neutral-700">{safeCategory.description}</p>
            )}
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100">
              {safeCategory.heroImageUrl ? (
                <Image
                  src={safeCategory.heroImageUrl}
                  alt={safeCategory.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                  Category imagery coming soon.
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Products
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
                {safeProducts.length} {isBadgePage ? `${safeCategory.title.toLowerCase()} items` : `items in ${safeCategory.title}`}
              </h2>
            </div>
          </div>

          {isBadgePage ? (
            <AllProductsGrid
              products={safeProducts as any[]}
              showBadgeFilter={false}
              showCategoryFilter={false}
            />
          ) : safeCategory.isSubscriptionCategory ? (
            <SubscriptionProductGrid products={safeProducts as any[]} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {safeProducts.length > 0 ? (
                safeProducts.map((product: any) => (
                  <Link
                    key={product._id}
                    href={product.slug ? `/products/${product.slug}` : "#"}
                    className="flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100"
                  >
                    <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-neutral-100">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
                          Product imagery coming soon.
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {product.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {product.currency || "AED"} {product.price}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-neutral-600">
                  No products found in this category yet.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
