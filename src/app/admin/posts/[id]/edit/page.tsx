import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "@/components/post-form";
import { updatePostAction } from "@/actions/post-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireAdmin();

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  const boundUpdateAction = updatePostAction.bind(null, post.id);

  return (
    <main className="container">
      <h1>Editar post</h1>

      <PostForm
        action={boundUpdateAction}
        initialData={{
          title: post.title,
          slug: post.slug,
          content: post.content,
          status: post.status,
        }}
      />

      <p>
        <Link href="/admin/posts">Volver</Link>
      </p>
    </main>
  );
}