import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "../../../sanity/client";
import { characterBySlugQuery, productsByCharacterQuery } from "../../../sanity/queries";

interface CharacterPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { slug } = await params;

  const character = await sanityClient.fetch(characterBySlugQuery(slug));

  if (!character) {
    notFound();
  }

  const products = await sanityClient.fetch(productsByCharacterQuery(slug));

  const gradient = character.moodColor || "from-emerald-100 to-emerald-200";

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Character
            </p>
            <h1 className="text-xl font-semibold text-neutral-900">{character.title}</h1>
            {character.tagline && (
              <p className="text-sm text-neutral-700">{character.tagline}</p>
            )}
            {Array.isArray(character.bio) && (
              <div className="space-y-2 text-sm text-neutral-700">
                {character.bio.map((block: any, index: number) => {
                  const text = Array.isArray(block.children)
                    ? block.children.map((child: any) => child.text).join("")
                    : "";
                  if (!text) return null;
                  return <p key={index}>{text}</p>;
                })}
              </div>
            )}
          </div>
          <div
            className={`rounded-3xl bg-gradient-to-br ${gradient} p-4 shadow-sm ring-1 ring-neutral-100`}
          >
            <div className="relative mx-auto h-48 w-full max-w-sm overflow-hidden rounded-2xl bg-white/70">
              {character.cardImageUrl ? (
                <Image
                  src={character.cardImageUrl}
                  alt={character.title}
                  fill
                  className="object-contain drop-shadow-sm"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                  Character illustration coming soon.
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Picks
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
                Products picked for {character.title}
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
                No products have been assigned to this character yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
