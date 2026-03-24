import Link from "next/link";
import PostForm from "@/components/post-form";
import { createPostAction } from "@/actions/post-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NewPostPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "title-required":
      return "El título es obligatorio.";
    case "content-required":
      return "El contenido es obligatorio.";
    case "slug-invalid":
      return "El slug es inválido.";
    case "excerpt-invalid":
      return "El extracto no es válido.";
    case "category-invalid":
      return "La categoría seleccionada no es válida.";
    case "save-error":
      return "No se pudo guardar el post.";
    default:
      return undefined;
  }
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  await requireAdmin();

  const resolvedSearchParams = (await searchParams) ?? {};

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  const errorMessage = getErrorMessage(resolvedSearchParams.error);

  return (
    <main className="container">
      <h1>Nuevo post</h1>

      <PostForm
        action={createPostAction}
        categories={categories}
        errorMessage={errorMessage}
      />

      <p>
        <Link href="/admin/posts">Volver</Link>
      </p>
    </main>
  );
}