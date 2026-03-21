import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function PublicPostsPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return (
    <main className="container">
      <h1>Posts públicos</h1>

      {posts.length === 0 ? (
        <p>No hay publicaciones disponibles.</p>
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
              <p>{post.content.slice(0, 180)}...</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}