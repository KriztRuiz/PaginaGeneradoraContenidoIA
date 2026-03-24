import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PublicPostsPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getExcerpt(excerpt: string | null, content: string) {
  if (excerpt && excerpt.trim().length > 0) {
    return excerpt.trim();
  }

  const plainContent = content.trim().replace(/\s+/g, " ");

  if (plainContent.length <= 180) {
    return plainContent;
  }

  return `${plainContent.slice(0, 180).trim()}...`;
}

export default async function PublicPostsPage({
  searchParams,
}: PublicPostsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedCategorySlug = resolvedSearchParams.category;

  const [categories, posts] = await Promise.all([
    prisma.category.findMany({
      where: {
        posts: {
          some: {
            status: PostStatus.PUBLISHED,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        ...(selectedCategorySlug
          ? {
              category: {
                slug: selectedCategorySlug,
              },
            }
          : {}),
      },
      orderBy: {
        publishedAt: "desc",
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
    }),
  ]);

  return (
    <main className="container">
      <h1>Posts públicos</h1>

      <section className="stack" style={{ marginBottom: "24px" }}>
        <h2>Categorías</h2>

        <div className="actions">
          <Link
            href="/posts"
            aria-current={!selectedCategorySlug ? "page" : undefined}
          >
            Todas
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/posts?category=${category.slug}`}
              aria-current={
                selectedCategorySlug === category.slug ? "page" : undefined
              }
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {posts.length === 0 ? (
        <p>No hay publicaciones disponibles para este filtro.</p>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <article key={post.id} className="card">
              <h2>
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </h2>

              <p>
                <strong>Publicado:</strong> {formatDate(post.publishedAt)}
              </p>

              <p>
                <strong>Categoría:</strong>{" "}
                {post.category ? post.category.name : "Sin categoría"}
              </p>

              <p>{getExcerpt(post.excerpt, post.content)}</p>

              <p>
                <Link href={`/posts/${post.slug}`}>Leer más</Link>
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}