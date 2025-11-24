import Image from "next/image";
import { notFound } from "next/navigation";
import { sanityClient } from "../../../sanity/client";
import { blogPostBySlugQuery } from "../../../sanity/queries";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await sanityClient.fetch(blogPostBySlugQuery, { slug });

  if (!post) {
    notFound();
  }

  const paragraphs = Array.isArray(post.content)
    ? post.content
        .map((block: any) => {
          if (!Array.isArray(block.children)) return "";
          return block.children.map((child: any) => child.text).join("");
        })
        .filter((text: string) => text && text.trim().length > 0)
    : [];

  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          {dateLabel && (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              {dateLabel}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-sm text-neutral-600">{post.excerpt}</p>
          )}
        </header>

        {post.coverImageUrl && (
          <div className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Story
          </p>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-800">
            {paragraphs.length > 0 ? (
              paragraphs.map((text: string, index: number) => (
                <p key={index}>{text}</p>
              ))
            ) : (
              <p>More details coming soon.</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
