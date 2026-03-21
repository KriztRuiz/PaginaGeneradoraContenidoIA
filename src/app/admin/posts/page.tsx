import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/actions/auth-actions";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminPostsPage() {
  await requireAdmin();

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

      {posts.length === 0 ? (
        <p>No hay posts todavía.</p>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <article key={post.id} className="card">
              <h2>{post.title}</h2>
              <p>
                <strong>Status:</strong> {post.status}
              </p>
              <p>
                <strong>Slug:</strong> {post.slug}
              </p>
              <p>
                <strong>Actualizado:</strong> {formatDate(post.updatedAt)}
              </p>
              <p>
                <Link href={`/admin/posts/${post.id}/edit`}>Editar</Link>
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}