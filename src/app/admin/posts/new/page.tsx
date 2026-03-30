import Link from "next/link";
import { createPostAction } from "@/actions/post-actions";
import NewPostEditor from "@/components/new-post-editor";
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
    case "seo-title-invalid":
      return "El SEO title no es válido.";
    case "seo-description-invalid":
      return "La SEO description no es válida.";
    case "scheduled-at-invalid":
      return "La fecha programada no es válida o es obligatoria para un post programado.";
    case "category-invalid":
      return "La categoría seleccionada no es válida.";
    case "status-invalid":
      return "El estado del post no es válido.";
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

      <NewPostEditor
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