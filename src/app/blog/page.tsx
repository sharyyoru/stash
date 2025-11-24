import Link from "next/link";
import Image from "next/image";
import { sanityClient } from "../../sanity/client";
import { allBlogPostsQuery } from "../../sanity/queries";

interface BlogPostSummary {
  _id: string;
  slug?: string;
  title: string;
  publishedAt?: string;
  excerpt?: string;
  coverImageUrl?: string;
}

export default async function BlogIndexPage() {
  const posts = await sanityClient.fetch(allBlogPostsQuery).catch(() => []);

  const safePosts: BlogPostSummary[] = Array.isArray(posts) ? posts : [];

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Blog
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
              Notes from the Stash desk.
            </h1>
            <p className="mt-1 text-xs text-neutral-600">
              Behind-the-scenes peeks, desk setup ideas, and stationery stories.
            </p>
          </div>
        </div>

        {safePosts.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No blog posts yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {safePosts.map((post) => {
              const href = post.slug ? `/blog/${post.slug}` : "#";
              const dateLabel = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : undefined;

              return (
                <Link
                  key={post._id}
                  href={href}
                  className="flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-neutral-100">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
                        Blog imagery coming soon.
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dateLabel && (
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        {dateLabel}
                      </p>
                    )}
                    <p className="text-sm font-medium text-neutral-900">
                      {post.title}
                    </p>
                    {post.excerpt && (
                      <p className="text-xs text-neutral-600 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
