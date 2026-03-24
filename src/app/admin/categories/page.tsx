import Link from "next/link";
import CategoryForm from "@/components/category-form";
import { createCategoryAction, deleteCategoryAction } from "@/actions/category-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CategoriesPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

function getSuccessMessage(status?: string) {
  switch (status) {
    case "created":
      return "Categoría creada correctamente.";
    case "deleted":
      return "Categoría eliminada correctamente.";
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
      return "No se pudo guardar la categoría.";
    case "delete-error":
      return "No se pudo eliminar la categoría.";
    case "not-found":
      return "La categoría no existe.";
    case "has-posts":
      return "No puedes eliminar una categoría que todavía tiene posts asociados.";
    default:
      return undefined;
  }
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  await requireAdmin();

  const resolvedSearchParams = (await searchParams) ?? {};

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
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

  const successMessage = getSuccessMessage(resolvedSearchParams.status);
  const errorMessage = getErrorMessage(resolvedSearchParams.error);

  return (
    <main className="container">
      <h1>Categorías</h1>

      <section className="stack" style={{ marginBottom: "32px" }}>
        <h2>Nueva categoría</h2>

        <CategoryForm
          action={createCategoryAction}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      </section>

      <section className="stack">
        <h2>Listado</h2>

        {categories.length === 0 ? (
          <p style={{ margin: 0, color: "#475467" }}>
            Aún no hay categorías registradas.
          </p>
        ) : (
          <div className="stack">
            {categories.map((category) => (
              <article
                key={category.id}
                className="stack"
                style={{
                  border: "1px solid #d0d5dd",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div className="stack" style={{ gap: "4px" }}>
                  <strong>{category.name}</strong>
                  <span style={{ color: "#475467" }}>/{category.slug}</span>
                  <span style={{ color: "#475467", fontSize: "14px" }}>
                    Posts asociados: {category._count.posts}
                  </span>
                </div>

                <div className="actions">
                  <Link href={`/admin/categories/${category.id}/edit`}>
                    Editar
                  </Link>

                  <form action={deleteCategoryAction.bind(null, category.id)}>
                    <button
                      type="submit"
                      disabled={category._count.posts > 0}
                      title={
                        category._count.posts > 0
                          ? "No puedes eliminar una categoría con posts asociados."
                          : undefined
                      }
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p>
        <Link href="/admin/posts">Volver a posts</Link>
      </p>
    </main>
  );
}