import Link from "next/link";
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

export default async function PublicPostDetailPage({
  params,
}: PublicPostDetailPageProps) {
  const { slug } = await params;

  const post = await prisma.post.findFirst({
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

        <div className="post-content">{post.content}</div>
      </article>
    </main>
  );
}