"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { resolveBaseSlug } from "@/lib/slug";
import { validateCategoryInput } from "@/lib/category-validation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value === "" ? undefined : value;
}

function getValidationErrorCode(name: string, slug: string | undefined) {
  const errors = validateCategoryInput({ name, slug });

  if (errors.name) return "name-invalid";
  if (errors.slug) return "slug-invalid";

  return null;
}

async function generateUniqueCategorySlug(baseSlug: string, excludeId?: string) {
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/posts");
  revalidatePath("/posts");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();

  const name = getString(formData, "name");
  const inputSlug = getOptionalString(formData, "slug");

  const validationErrorCode = getValidationErrorCode(name, inputSlug);

  if (validationErrorCode) {
    redirect(`/admin/categories?error=${validationErrorCode}`);
  }

  const baseSlug = resolveBaseSlug(inputSlug ?? "", name);

  if (!baseSlug) {
    redirect("/admin/categories?error=slug-invalid");
  }

  try {
    const slug = await generateUniqueCategorySlug(baseSlug);

    await prisma.category.create({
      data: {
        name,
        slug,
      },
      select: {
        id: true,
      },
    });
  } catch {
    redirect("/admin/categories?error=save-error");
  }

  revalidateCategoryPaths();
  redirect("/admin/categories?status=created");
}

export async function updateCategoryAction(
  categoryId: string,
  formData: FormData
) {
  await requireAdmin();

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!existingCategory) {
    redirect("/admin/categories?error=not-found");
  }

  const name = getString(formData, "name");
  const inputSlug = getOptionalString(formData, "slug");

  const validationErrorCode = getValidationErrorCode(name, inputSlug);

  if (validationErrorCode) {
    redirect(`/admin/categories/${categoryId}/edit?error=${validationErrorCode}`);
  }

  const baseSlug = resolveBaseSlug(inputSlug ?? "", name);

  if (!baseSlug) {
    redirect(`/admin/categories/${categoryId}/edit?error=slug-invalid`);
  }

  try {
    const slug = await generateUniqueCategorySlug(baseSlug, existingCategory.id);

    await prisma.category.update({
      where: { id: existingCategory.id },
      data: {
        name,
        slug,
      },
      select: {
        id: true,
      },
    });
  } catch {
    redirect(`/admin/categories/${categoryId}/edit?error=save-error`);
  }

  revalidateCategoryPaths();
  redirect(`/admin/categories/${categoryId}/edit?status=updated`);
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  if (!category) {
    redirect("/admin/categories?error=not-found");
  }

  if (category._count.posts > 0) {
    redirect("/admin/categories?error=has-posts");
  }

  try {
    await prisma.category.delete({
      where: { id: category.id },
    });
  } catch {
    redirect("/admin/categories?error=delete-error");
  }

  revalidateCategoryPaths();
  redirect("/admin/categories?status=deleted");
}