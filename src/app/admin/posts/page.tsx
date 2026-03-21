import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/actions/auth-actions";
import ConfirmDelete from "@/components/confirm-delete";
import FormMessage from "@/components/form-message";

type AdminPostsPageProps = {
  searchParams?: Promise<{
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

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  await requireAdmin();

  const resolvedSearchParams = (await searchParams) ?? {};
  const pageMessage = getPageMessage(
    resolvedSearchParams.status,
    resolvedSearchParams.error,
  );

  const posts = await prisma.post.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="container">
      <div className="toolbar">
        <h1>Posts</h1>

        <div className="toolbar-actions">
          <Link href="/admin/posts/new">Nuevo post</Link>

          <form action={logoutAction}>
            <button type="submit">Salir</button>
          </form>
        </div>
      </div>

      {pageMessage ? (
        <FormMessage type={pageMessage.type} message={pageMessage.message} />
      ) : null}

      {posts.length === 0 ? (
        <p>No hay posts todavía.</p>
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
                <strong>Actualizado:</strong> {formatDate(post.updatedAt)}
              </p>

              <div className="actions">
                <Link href={`/admin/posts/${post.id}/edit`}>Editar</Link>

                <ConfirmDelete postId={post.id} title={post.title} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}