import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PublicPostDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function getPublishedPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: {
      slug,
      status: PostStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
      publishedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PublicPostDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Post no encontrado",
      description: "La publicación solicitada no está disponible.",
    };
  }

  return {
    title: post.seoTitle || post.title,
    description:
      post.seoDescription || post.excerpt || "Publicación disponible.",
  };
}

export default async function PublicPostDetailPage({
  params,
}: PublicPostDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="container narrow">
      <article className="card">
        <p style={{ marginTop: 0 }}>
          <Link href="/posts">← Volver a posts</Link>
        </p>

        <h1>{post.title}</h1>

        <p>
          <strong>Publicado:</strong> {formatDate(post.publishedAt)}
        </p>

        <p>
          <strong>Categoría:</strong>{" "}
          {post.category ? (
            <Link href={`/posts?category=${post.category.slug}`}>
              {post.category.name}
            </Link>
          ) : (
            "Sin categoría"
          )}
        </p>

        {post.excerpt ? (
          <p>
            <strong>Extracto:</strong> {post.excerpt}
          </p>
        ) : null}

        <div
          className="post-content"
          style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
        >
          {post.content}
        </div>
      </article>
    </main>
  );
}