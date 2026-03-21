import { notFound } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PublicPostDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicPostDetailPage({
  params,
}: PublicPostDetailPageProps) {
  const { slug } = await params;

  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: PostStatus.PUBLISHED,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <main className="container narrow">
      <article className="card">
        <h1>{post.title}</h1>
        <p>
          <strong>Publicado:</strong>{" "}
          {post.publishedAt
            ? new Intl.DateTimeFormat("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(post.publishedAt)
            : "—"}
        </p>

        <div className="post-content">{post.content}</div>
      </article>
    </main>
  );
}