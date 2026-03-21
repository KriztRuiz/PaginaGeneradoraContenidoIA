import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "@/components/post-form";
import ConfirmDelete from "@/components/confirm-delete";
import { updatePostAction } from "@/actions/post-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

function getSuccessMessage(status?: string) {
  switch (status) {
    case "created":
      return "Post creado correctamente.";
    case "updated":
      return "Post actualizado correctamente.";
    default:
      return undefined;
  }
}

function getErrorMessage(error?: string) {
  switch (error) {
    case "title-required":
      return "El título es obligatorio.";
    case "content-required":
      return "El contenido es obligatorio.";
    case "slug-invalid":
      return "El slug es inválido.";
    case "save-error":
      return "No se pudo guardar el post.";
    default:
      return undefined;
  }
}

export default async function EditPostPage({
  params,
  searchParams,
}: EditPostPageProps) {
  await requireAdmin();

  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  const boundUpdateAction = updatePostAction.bind(null, post.id);
  const successMessage = getSuccessMessage(resolvedSearchParams.status);
  const errorMessage = getErrorMessage(resolvedSearchParams.error);

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
        successMessage={successMessage}
        errorMessage={errorMessage}
      />

      <section className="stack" style={{ marginTop: "24px" }}>
        <h2>Zona de peligro</h2>
        <ConfirmDelete
          postId={post.id}
          title={post.title}
          buttonLabel="Eliminar post"
        />
      </section>

      <p>
        <Link href="/admin/posts">Volver</Link>
      </p>
    </main>
  );
}