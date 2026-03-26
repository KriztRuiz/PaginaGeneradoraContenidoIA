import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "@/components/post-form";
import ConfirmDelete from "@/components/confirm-delete";
import PostRevisions from "@/components/post-revisions";
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
      return "No se pudo actualizar el post.";
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

  const [post, categories, revisions] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        seoTitle: true,
        seoDescription: true,
        scheduledAt: true,
        categoryId: true,
        status: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.postRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        editorId: true,
        createdAt: true,
        snapshotJson: true,
      },
    }),
  ]);

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
        categories={categories}
        initialData={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          scheduledAt: post.scheduledAt?.toISOString() ?? null,
          categoryId: post.categoryId,
          status: post.status,
        }}
        successMessage={successMessage}
        errorMessage={errorMessage}
      />

      <PostRevisions revisions={revisions} />

      <section className="stack" style={{ marginTop: "24px" }}>
        <h2>Zona de peligro</h2>
        <ConfirmDelete postId={post.id} title={post.title} />
      </section>

      <p>
        <Link href="/admin/posts">Volver</Link>
      </p>
    </main>
  );
}