import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ConfirmDelete from "@/components/confirm-delete";
import FormMessage from "@/components/form-message";

type AdminPostsPageProps = {
  searchParams?: Promise<{
    category?: string;
    status?: string;
    error?: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getPageMessage(status?: string, error?: string) {
  if (status === "created") {
    return {
      type: "success" as const,
      message: "Post creado correctamente.",
    };
  }

  if (status === "deleted") {
    return {
      type: "success" as const,
      message: "Post eliminado correctamente.",
    };
  }

  if (error === "not-found") {
    return {
      type: "error" as const,
      message: "El post no existe o ya fue eliminado.",
    };
  }

  if (error === "delete-error") {
    return {
      type: "error" as const,
      message: "No se pudo eliminar el post.",
    };
  }

  return null;
}

function formatStatus(status: "DRAFT" | "PUBLISHED") {
  return status === "PUBLISHED" ? "Publicado" : "Borrador";
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

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  await requireAdmin();

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedCategorySlug = resolvedSearchParams.category;

  const pageMessage = getPageMessage(
    resolvedSearchParams.status,
    resolvedSearchParams.error
  );

  const [categories, posts] = await Promise.all([
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    }),
    prisma.post.findMany({
      where: selectedCategorySlug
        ? {
            category: {
              slug: selectedCategorySlug,
            },
          }
        : undefined,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        status: true,
        updatedAt: true,
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
      <div className="toolbar">
        <h1>Posts</h1>

        <div className="toolbar-actions">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/categories">Categorías</Link>
          <Link href="/admin/posts/new">Nuevo post</Link>
        </div>
      </div>

      {pageMessage ? (
        <FormMessage type={pageMessage.type} message={pageMessage.message} />
      ) : null}

      <section className="stack" style={{ marginBottom: "24px" }}>
        <h2>Filtrar por categoría</h2>

        <div className="actions">
          <Link
            href="/admin/posts"
            aria-current={!selectedCategorySlug ? "page" : undefined}
          >
            Todas
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/admin/posts?category=${category.slug}`}
              aria-current={
                selectedCategorySlug === category.slug ? "page" : undefined
              }
            >
              {category.name} ({category._count.posts})
            </Link>
          ))}
        </div>
      </section>

      {posts.length === 0 ? (
        <p>No hay posts para este filtro.</p>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <article key={post.id} className="card">
              <h2>{post.title}</h2>

              <p>
                <strong>Estado:</strong> {formatStatus(post.status)}
              </p>

              <p>
                <strong>Slug:</strong> {post.slug}
              </p>

              <p>
                <strong>Categoría:</strong>{" "}
                {post.category ? post.category.name : "Sin categoría"}
              </p>

              <p>
                <strong>Extracto:</strong> {getExcerpt(post.excerpt, post.content)}
              </p>

              <p>
                <strong>Actualizado:</strong> {formatDate(post.updatedAt)}
              </p>

              <div className="actions">
                <Link href={`/admin/posts/${post.id}/edit`}>Editar</Link>
                <Link href={`/posts/${post.slug}`}>Ver público</Link>
                <ConfirmDelete postId={post.id} title={post.title} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}