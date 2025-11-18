import Image from "next/image";
import Link from "next/link";
import CharacterStrip from "../components/character-strip";
import ProductSliderSection from "../components/product-section-slider";
import type { Character as StripCharacter } from "../components/character-strip";
import { sanityClient } from "../sanity/client";
import {
  homepageQuery,
  allCategoriesForHomeQuery,
  allCharactersForStripQuery,
  latestProductsQuery,
  bestSellerProductsQuery,
} from "../sanity/queries";

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  label?: string;
  slug?: string;
  imageUrl?: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
  href: string;
  tone: string;
  imageSrc?: string;
};

const defaultCategories: Category[] = [
  {
    id: "1",
    name: "Stickers",
    description: "Sheets and rolls for planners, laptops and water bottles.",
    href: "#",
    tone: "from-rose-50 to-rose-100",
    imageSrc: "/media/categories/stickers.png",
  },
  {
    id: "2",
    name: "Notebooks",
    description: "Grid, dot and plain notebooks with soft neutrals.",
    href: "#",
    tone: "from-sky-50 to-sky-100",
    imageSrc: "/media/categories/notebooks.png",
  },
  {
    id: "3",
    name: "Desk tools",
    description: "Tabs, markers and tools to organise your desk.",
    href: "#",
    tone: "from-amber-50 to-amber-100",
    imageSrc: "/media/categories/desk-tools.png",
  },
  {
    id: "4",
    name: "Bundles",
    description: "Curated sets that make gift giving too easy.",
    href: "#",
    tone: "from-emerald-50 to-emerald-100",
    imageSrc: "/media/categories/bundles.png",
  },
  {
    id: "5",
    name: "Desk drops",
    description: "Limited collections that will not restock forever.",
    href: "#",
    tone: "from-neutral-50 to-neutral-100",
    imageSrc: "/media/categories/desk-drops.png",
  },
];

const newInProducts: Product[] = [
  {
    id: "1",
    name: "Grid Sticker Stack",
    category: "Stickers",
    price: "AED 35",
    label: "New",
    slug: "grid-sticker-stack",
  },
  {
    id: "2",
    name: "Soft Focus Notebook A5",
    category: "Notebooks",
    price: "AED 59",
    label: "New",
    slug: "soft-focus-notebook-a5",
  },
  {
    id: "3",
    name: "Tab Marker Palette",
    category: "Desk tools",
    price: "AED 42",
    slug: "tab-marker-palette",
  },
  {
    id: "4",
    name: "Autumn Desk Bundle",
    category: "Bundles",
    price: "AED 149",
    label: "Drop",
    slug: "autumn-desk-bundle",
  },
];

const bestSellerProducts: Product[] = [
  {
    id: "5",
    name: "Everyday Icons Sticker Sheet",
    category: "Stickers",
    price: "AED 29",
    label: "Bestseller",
    slug: "everyday-icons-sticker-sheet",
  },
  {
    id: "6",
    name: "Neutral Grid Notebook A6",
    category: "Notebooks",
    price: "AED 39",
    slug: "neutral-grid-notebook-a6",
  },
  {
    id: "7",
    name: "Desk Highlight Duo",
    category: "Desk tools",
    price: "AED 55",
    slug: "desk-highlight-duo",
  },
  {
    id: "8",
    name: "Slow Morning Sticker Pack",
    category: "Stickers",
    price: "AED 32",
    slug: "slow-morning-sticker-pack",
  },
];

export default async function Home() {
  const [
    homepage,
    categoriesData,
    charactersData,
    latestProductsData,
    bestSellerProductsData,
  ] = await Promise.all([
    sanityClient.fetch(homepageQuery).catch(() => null),
    sanityClient.fetch(allCategoriesForHomeQuery).catch(() => []),
    sanityClient.fetch(allCharactersForStripQuery).catch(() => []),
    sanityClient.fetch(latestProductsQuery).catch(() => []),
    sanityClient.fetch(bestSellerProductsQuery).catch(() => []),
  ]);

  const mapSanityProductToProduct = (p: any): Product => ({
    id: p._id,
    name: p.title,
    category: p.category || "Stash",
    price: `${p.currency || "AED"} ${p.price ?? ""}`,
    label:
      Array.isArray(p.badges) && p.badges.length > 0 ? p.badges[0] : undefined,
    slug: p.slug,
    imageUrl: p.imageUrl,
  });

  const cmsNewInFromHomepage =
    Array.isArray((homepage as any)?.newIn) && (homepage as any).newIn.length > 0
      ? (homepage as any).newIn.map(mapSanityProductToProduct)
      : null;

  const latestMapped = Array.isArray(latestProductsData)
    ? (latestProductsData as any[]).map(mapSanityProductToProduct)
    : null;

  const cmsBestSellersFromHomepage =
    Array.isArray((homepage as any)?.bestSellers) &&
    (homepage as any).bestSellers.length > 0
      ? (homepage as any).bestSellers.map(mapSanityProductToProduct)
      : null;

  const bestSellersFromBadges = Array.isArray(bestSellerProductsData)
    ? (bestSellerProductsData as any[]).map(mapSanityProductToProduct)
    : null;

  const newInProductsToShow = latestMapped ?? cmsNewInFromHomepage ?? newInProducts;
  const bestSellerProductsToShow =
    bestSellersFromBadges ?? cmsBestSellersFromHomepage ?? bestSellerProducts;

  const categoriesToShow: Category[] =
    Array.isArray(categoriesData) && categoriesData.length > 0
      ? (categoriesData as any[]).map((c, index) => ({
          id: c._id ?? String(index),
          name: c.title,
          description: c.description ?? "",
          href: c.slug ? `/category/${c.slug}` : "#",
          tone:
            c.tone ||
            defaultCategories[index % defaultCategories.length]?.tone ||
            "from-neutral-50 to-neutral-100",
          imageSrc:
            c.heroImageUrl ||
            defaultCategories[index % defaultCategories.length]?.imageSrc,
        }))
      : defaultCategories;

  const charactersToShow: StripCharacter[] | undefined =
    Array.isArray(charactersData) && charactersData.length > 0
      ? (charactersData as any[]).map((c, index) => ({
          id: index + 1,
          name: c.title,
          code: c.tagline ?? "",
          description: c.tagline ?? "",
          moodColor:
            c.moodColor ||
            [
              "from-emerald-100 to-emerald-200",
              "from-sky-100 to-sky-200",
              "from-amber-100 to-amber-200",
              "from-violet-100 to-violet-200",
            ][index % 4],
          imageSrc: c.cardImageUrl,
          slug: c.slug,
        }))
      : undefined;

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-10">
        <Hero />
        <CharacterStrip characters={charactersToShow} />
        <CategoryGrid categories={categoriesToShow} />
        <ProductSliderSection
          sectionId="new-in"
          eyebrow="Just landed"
          title="New in"
          description="Fresh stationery and stickers to refresh your desk."
          products={newInProductsToShow}
        />
        <ProductSliderSection
          sectionId="best-sellers"
          eyebrow="Hot right now"
          title="Best sellers"
          description="The pieces Stash regulars keep re-ordering."
          products={bestSellerProductsToShow}
        />
        <StoryStrip />
      </div>
    </div>
  );
}

function Hero() {
  const shops = [
    {
      id: "subscribe",
      name: "Subscribe",
      title: "Monthly Stash Box",
      description: "Curated mix of stickers and stationery.",
      imageSrc: "/media/shops/subscribe.png",
      videoSrc: "/media/shops/subscribe.mp4",
    },
    {
      id: "new",
      name: "New Stuff",
      title: "Just dropped",
      description: "Fresh arrivals for your next desk reset.",
      imageSrc: "/media/shops/new-stuff.png",
      videoSrc: "/media/shops/new-stuff.mp4",
    },
    {
      id: "stickers",
      name: "Stickers",
      title: "Sticker street",
      description: "Sheets, packs and washi-style stickers.",
      imageSrc: "/media/shops/stickers.png",
      videoSrc: "/media/shops/stickers.mp4",
    },
    {
      id: "desk",
      name: "Desk & Lifestyle",
      title: "Desk and lifestyle",
      description: "Mugs, totes and desk-side little things.",
      imageSrc: "/media/shops/desk-lifestyle.png",
      videoSrc: "/media/shops/desk-lifestyle.mp4",
    },
  ];

  return (
    <section className="pt-4">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 p-5 shadow-sm stash-hero-gradient">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-6 bottom-6 h-12 rounded-full stash-rainbow-button opacity-80" />
          <div className="absolute right-8 top-6 h-16 w-16 rounded-full bg-amber-100/80" />
        </div>
        <div className="relative mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-900">
              Choose your next stop
            </p>
            <p className="mt-1 max-w-md text-xs text-neutral-600">
              Tap a shop to explore subscriptions, new drops, stickers or desk and lifestyle.
            </p>
          </div>
        </div>
        <div className="relative grid gap-4 md:grid-cols-4">
          {shops.map((shop) => (
            <a
              key={shop.id}
              href={
                shop.id === "new"
                  ? "#new-in"
                  : shop.id === "stickers" || shop.id === "desk"
                  ? "#categories"
                  : "#"
              }
              className="group relative flex flex-col justify-between rounded-2xl bg-white/90 p-4 text-left shadow-sm ring-1 ring-emerald-100 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
            >
              <div className="mb-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-100">
                  {shop.imageSrc ? (
                    <>
                      <Image
                        src={shop.imageSrc}
                        alt={shop.title}
                        fill
                        className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                      />
                      {shop.videoSrc && (
                        <video
                          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          muted
                          loop
                          playsInline
                          autoPlay
                        >
                          <source src={shop.videoSrc} type="video/mp4" />
                        </video>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-neutral-400">
                      Visual coming soon
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {shop.name}
                </p>
                <p className="text-sm font-semibold text-neutral-900">{shop.title}</p>
                <p className="text-xs text-neutral-600">{shop.description}</p>
              </div>
              <div className="mt-3 flex items-center justify-end text-[11px] text-neutral-600">
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  View
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

type CategoryGridProps = {
  categories: Category[];
};

function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section id="categories" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Shop by category
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
            Find your kind of stash.
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden items-center justify-center rounded-full px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm md:inline-flex stash-rainbow-button"
        >
          View all products
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className={`group flex flex-col justify-between rounded-3xl bg-gradient-to-br ${category.tone} p-4 text-left shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            {category.imageSrc && (
              <div className="mb-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-white/70">
                  <Image
                    src={category.imageSrc}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                {category.name}
              </p>
              <p className="text-sm text-neutral-700">{category.description}</p>
            </div>
            <span className="mt-3 inline-flex items-center text-[11px] font-medium text-neutral-700">
              Shop {category.name.toLowerCase()}
              <span className="ml-1 text-xs">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

type ProductSectionProps = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
};

function ProductSection({
  sectionId,
  eyebrow,
  title,
  description,
  products,
}: ProductSectionProps) {
  const isBestSellers = sectionId === "best-sellers";
  return (
    <section id={sectionId} className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-[0.2em] ${
              isBestSellers ? "stash-rainbow-text" : "text-neutral-500"
            }`}
          >
            {eyebrow}
          </p>
          <h2
            className={`mt-2 text-lg font-semibold tracking-tight ${
              isBestSellers ? "stash-rainbow-text" : "text-neutral-900"
            }`}
          >
            {title}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">{description}</p>
        </div>
        <Link
          href="/products"
          className="hidden text-xs font-medium text-neutral-700 underline-offset-4 hover:text-neutral-900 hover:underline md:inline-flex"
        >
          View all
        </Link>
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="min-w-[220px] max-w-xs flex-1 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md md:min-w-0">
      <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-3 text-[11px] text-neutral-600">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
              {product.category}
            </span>
            {product.label ? (
              <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                {product.label}
              </span>
            ) : null}
          </div>
          <p className="mt-auto max-w-[10rem] text-[11px] text-neutral-500">
            Imagined product imagery placeholder.
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-900">{product.name}</p>
        <p className="text-xs text-neutral-500">{product.price}</p>
        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
        >
          Add to stash
        </button>
      </div>
    </div>
  );
}

function StoryStrip() {
  return (
    <section className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-100 md:grid-cols-3">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Why Stash
        </p>
        <p className="text-sm font-semibold text-neutral-900">
          Built for people who love their desk.
        </p>
        <p className="text-xs text-neutral-500">
          Designed in Dubai with small-batch drops so your setup feels
          intentional, not generic.
        </p>
      </div>
      <div className="space-y-1 text-xs text-neutral-500">
        <p className="font-medium text-neutral-900">Materials first</p>
        <p>
          Smooth, high GSM paper, crisp printing and inks that do not ghost
          through your notes.
        </p>
      </div>
      <div className="space-y-1 text-xs text-neutral-500">
        <p className="font-medium text-neutral-900">Designed to mix</p>
        <p>
          Every collection is built to layer with the rest of your stash so no
          sticker or notebook is a one-off.
        </p>
      </div>
    </section>
  );
}
