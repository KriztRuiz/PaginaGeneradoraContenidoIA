"use server";

import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { resolveBaseSlug } from "@/lib/slug";
import { validatePostInput } from "@/lib/post-validation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value === "" ? undefined : value;
}

function getNextStatus(formData: FormData) {
  const intent = getString(formData, "intent");
  return intent === "publish" ? PostStatus.PUBLISHED : PostStatus.DRAFT;
}

function getValidationErrorCode(
  title: string,
  slug: string | undefined,
  excerpt: string | undefined,
  content: string,
  categoryId: string | undefined,
  status: PostStatus
) {
  const errors = validatePostInput({
    title,
    slug,
    excerpt,
    content,
    categoryId,
    status,
  });

  if (errors.title) return "title-required";
  if (errors.content) return "content-required";
  if (errors.slug) return "slug-invalid";
  if (errors.excerpt) return "excerpt-invalid";
  if (errors.categoryId) return "category-invalid";

  return null;
}

async function ensureCategoryExists(categoryId?: string) {
  if (!categoryId) return null;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  return category;
}

async function generateUniqueSlug(baseSlug: string, excludeId?: string) {
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.post.findUnique({
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

export async function createPostAction(formData: FormData) {
  await requireAdmin();

  const title = getString(formData, "title");
  const inputSlug = getOptionalString(formData, "slug");
  const excerpt = getOptionalString(formData, "excerpt");
  const content = getString(formData, "content");
  const categoryId = getOptionalString(formData, "categoryId");
  const status = getNextStatus(formData);

  const validationErrorCode = getValidationErrorCode(
    title,
    inputSlug,
    excerpt,
    content,
    categoryId,
    status
  );

  if (validationErrorCode) {
    redirect(`/admin/posts/new?error=${validationErrorCode}`);
  }

  if (categoryId) {
    const category = await ensureCategoryExists(categoryId);

    if (!category) {
      redirect("/admin/posts/new?error=category-invalid");
    }
  }

  const baseSlug = resolveBaseSlug(inputSlug ?? "", title);

  if (!baseSlug) {
    redirect("/admin/posts/new?error=slug-invalid");
  }

  let createdPost: { id: string; slug: string };

  try {
    const slug = await generateUniqueSlug(baseSlug);

    createdPost = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        categoryId: categoryId ?? null,
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
      select: {
        id: true,
        slug: true,
      },
    });
  } catch {
    redirect("/admin/posts/new?error=save-error");
  }

  revalidatePath("/admin/posts");
  revalidatePath("/posts");
  revalidatePath(`/posts/${createdPost.slug}`);

  if (status === PostStatus.PUBLISHED) {
    redirect("/admin/posts?status=created");
  }

  redirect(`/admin/posts/${createdPost.id}/edit?status=created`);
}

export async function updatePostAction(postId: string, formData: FormData) {
  await requireAdmin();

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      publishedAt: true,
    },
  });

  if (!existingPost) {
    redirect("/admin/posts?error=not-found");
  }

  const title = getString(formData, "title");
  const inputSlug = getOptionalString(formData, "slug");
  const excerpt = getOptionalString(formData, "excerpt");
  const content = getString(formData, "content");
  const categoryId = getOptionalString(formData, "categoryId");
  const status = getNextStatus(formData);

  const validationErrorCode = getValidationErrorCode(
    title,
    inputSlug,
    excerpt,
    content,
    categoryId,
    status
  );

  if (validationErrorCode) {
    redirect(`/admin/posts/${postId}/edit?error=${validationErrorCode}`);
  }

  if (categoryId) {
    const category = await ensureCategoryExists(categoryId);

    if (!category) {
      redirect(`/admin/posts/${postId}/edit?error=category-invalid`);
    }
  }

  const baseSlug = resolveBaseSlug(inputSlug ?? "", title);

  if (!baseSlug) {
    redirect(`/admin/posts/${postId}/edit?error=slug-invalid`);
  }

  let updatedPost: { id: string; slug: string };

  try {
    const slug = await generateUniqueSlug(baseSlug, existingPost.id);

    updatedPost = await prisma.post.update({
      where: { id: existingPost.id },
      data: {
        title,
        slug,
        excerpt,
        content,
        categoryId: categoryId ?? null,
        status,
        publishedAt:
          status === PostStatus.PUBLISHED
            ? existingPost.publishedAt ?? new Date()
            : null,
      },
      select: {
        id: true,
        slug: true,
      },
    });
  } catch {
    redirect(`/admin/posts/${postId}/edit?error=save-error`);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/posts");
  revalidatePath(`/posts/${existingPost.slug}`);
  revalidatePath(`/posts/${updatedPost.slug}`);

  redirect(`/admin/posts/${updatedPost.id}/edit?status=updated`);
}

export async function deletePostAction(postId: string) {
  await requireAdmin();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!post) {
    redirect("/admin/posts?error=not-found");
  }

  try {
    await prisma.post.delete({
      where: { id: post.id },
    });
  } catch {
    redirect("/admin/posts?error=delete-error");
  }

  revalidatePath("/admin/posts");
  revalidatePath("/posts");
  revalidatePath(`/posts/${post.slug}`);

  redirect("/admin/posts?status=deleted");
}