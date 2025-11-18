import { sanityClient } from "../../sanity/client";
import { latestProductsQuery } from "../../sanity/queries";
import AllProductsGrid from "../../components/all-products-grid";

export default async function JustLandedPage() {
  const products = await sanityClient.fetch(latestProductsQuery).catch(() => []);

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Just landed
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
              The latest from Stash.
            </h1>
            <p className="mt-1 text-xs text-neutral-600">
              The newest 16 products added to your Stash, across stickers, mugs and more.
            </p>
          </div>
        </div>

        <AllProductsGrid products={safeProducts} />
      </div>
    </div>
  );
}
