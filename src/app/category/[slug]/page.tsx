import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "../../../sanity/client";
import { categoryBySlugQuery, productsByCategoryQuery } from "../../../sanity/queries";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [category, products] = await Promise.all([
    sanityClient.fetch(categoryBySlugQuery, { slug }),
    sanityClient.fetch(productsByCategoryQuery, { slug }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr] items-center">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Category
            </p>
            <h1 className="text-xl font-semibold text-neutral-900">{category.title}</h1>
            {category.description && (
              <p className="text-sm text-neutral-700">{category.description}</p>
            )}
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100">
              {category.heroImageUrl ? (
                <Image
                  src={category.heroImageUrl}
                  alt={category.title}
                  fill
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
                {products?.length || 0} items in {category.title}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product: any) => (
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
        </section>
      </div>
    </div>
  );
}
