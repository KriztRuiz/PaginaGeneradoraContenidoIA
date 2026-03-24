import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/category-form";
import {
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/category-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditCategoryPageProps = {
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
    case "updated":
      return "Categoría actualizada correctamente.";
    default:
      return undefined;
  }
}

function getErrorMessage(error?: string) {
  switch (error) {
    case "name-invalid":
      return "El nombre de la categoría no es válido.";
    case "slug-invalid":
      return "El slug de la categoría es inválido.";
    case "save-error":
      return "No se pudo actualizar la categoría.";
    case "not-found":
      return "La categoría no existe.";
    default:
      return undefined;
  }
}

export default async function EditCategoryPage({
  params,
  searchParams,
}: EditCategoryPageProps) {
  await requireAdmin();

  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  const category = await prisma.category.findUnique({
    where: { id },
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
  });

  if (!category) {
    notFound();
  }

  const boundUpdateAction = updateCategoryAction.bind(null, category.id);
  const successMessage = getSuccessMessage(resolvedSearchParams.status);
  const errorMessage = getErrorMessage(resolvedSearchParams.error);

  return (
    <main className="container">
      <h1>Editar categoría</h1>

      <CategoryForm
        action={boundUpdateAction}
        initialData={{
          name: category.name,
          slug: category.slug,
        }}
        successMessage={successMessage}
        errorMessage={errorMessage}
      />

      <section className="stack" style={{ marginTop: "24px" }}>
        <h2>Zona de peligro</h2>

        <p style={{ margin: 0, color: "#475467" }}>
          Posts asociados: {category._count.posts}
        </p>

        {category._count.posts > 0 ? (
          <p style={{ margin: 0, color: "#475467" }}>
            No puedes eliminar esta categoría mientras tenga posts asociados.
          </p>
        ) : (
          <form action={deleteCategoryAction.bind(null, category.id)}>
            <button type="submit">Eliminar categoría</button>
          </form>
        )}
      </section>

      <p>
        <Link href="/admin/categories">Volver a categorías</Link>
      </p>
    </main>
  );
}