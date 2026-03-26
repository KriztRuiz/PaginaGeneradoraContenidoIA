import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ConfirmDelete from "@/components/confirm-delete";
import FormMessage from "@/components/form-message";

type AdminPostsPageProps = {
  searchParams?: Promise<{
    category?: string;
    postStatus?: string;
    status?: string;
    error?: string;
  }>;
};

const STATUS_OPTIONS: Array<{ value: PostStatus; label: string }> = [
  { value: PostStatus.DRAFT, label: "Borrador" },
  { value: PostStatus.PENDING, label: "Pendiente" },
  { value: PostStatus.SCHEDULED, label: "Programado" },
  { value: PostStatus.PUBLISHED, label: "Publicado" },
  { value: PostStatus.REJECTED, label: "Rechazado" },
];

function isPostStatus(value?: string): value is PostStatus {
  return !!value && Object.values(PostStatus).includes(value as PostStatus);
}

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

  if (status === "updated") {
    return {
      type: "success" as const,
      message: "Post actualizado correctamente.",
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

function formatStatus(status: PostStatus) {
  switch (status) {
    case PostStatus.DRAFT:
      return "Borrador";
    case PostStatus.PENDING:
      return "Pendiente";
    case PostStatus.SCHEDULED:
      return "Programado";
    case PostStatus.PUBLISHED:
      return "Publicado";
    case PostStatus.REJECTED:
      return "Rechazado";
    default:
      return status;
  }
}

function getStatusBadgeStyle(status: PostStatus) {
  switch (status) {
    case PostStatus.PUBLISHED:
      return {
        backgroundColor: "#ecfdf3",
        color: "#067647",
        border: "1px solid #abefc6",
      };
    case PostStatus.SCHEDULED:
      return {
        backgroundColor: "#eff8ff",
        color: "#175cd3",
        border: "1px solid #b2ddff",
      };
    case PostStatus.PENDING:
      return {
        backgroundColor: "#fffaeb",
        color: "#b54708",
        border: "1px solid #fedf89",
      };
    case PostStatus.REJECTED:
      return {
        backgroundColor: "#fef3f2",
        color: "#b42318",
        border: "1px solid #fecdca",
      };
    case PostStatus.DRAFT:
    default:
      return {
        backgroundColor: "#f2f4f7",
        color: "#344054",
        border: "1px solid #d0d5dd",
      };
  }
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

function buildAdminPostsHref(params: {
  category?: string;
  postStatus?: string;
}) {
  const search = new URLSearchParams();

  if (params.category) {
    search.set("category", params.category);
  }

  if (params.postStatus) {
    search.set("postStatus", params.postStatus);
  }

  const query = search.toString();
  return query ? `/admin/posts?${query}` : "/admin/posts";
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  await requireAdmin();

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedCategorySlug = resolvedSearchParams.category;
  const selectedPostStatus = isPostStatus(resolvedSearchParams.postStatus)
    ? resolvedSearchParams.postStatus
    : undefined;

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
      where: {
        ...(selectedCategorySlug
          ? {
              category: {
                slug: selectedCategorySlug,
              },
            }
          : {}),
        ...(selectedPostStatus
          ? {
              status: selectedPostStatus,
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        status: true,
        updatedAt: true,
        publishedAt: true,
        scheduledAt: true,
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
            href={buildAdminPostsHref({ postStatus: selectedPostStatus })}
            aria-current={!selectedCategorySlug ? "page" : undefined}
          >
            Todas
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={buildAdminPostsHref({
                category: category.slug,
                postStatus: selectedPostStatus,
              })}
              aria-current={
                selectedCategorySlug === category.slug ? "page" : undefined
              }
            >
              {category.name} ({category._count.posts})
            </Link>
          ))}
        </div>
      </section>

      <section className="stack" style={{ marginBottom: "24px" }}>
        <h2>Filtrar por estado</h2>

        <div className="actions">
          <Link
            href={buildAdminPostsHref({ category: selectedCategorySlug })}
            aria-current={!selectedPostStatus ? "page" : undefined}
          >
            Todos
          </Link>

          {STATUS_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={buildAdminPostsHref({
                category: selectedCategorySlug,
                postStatus: option.value,
              })}
              aria-current={
                selectedPostStatus === option.value ? "page" : undefined
              }
            >
              {option.label}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                }}
              >
                <h2 style={{ margin: 0 }}>{post.title}</h2>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    ...getStatusBadgeStyle(post.status),
                  }}
                >
                  {formatStatus(post.status)}
                </span>
              </div>

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
                <strong>Programado:</strong> {formatDate(post.scheduledAt)}
              </p>

              <p>
                <strong>Publicado:</strong> {formatDate(post.publishedAt)}
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