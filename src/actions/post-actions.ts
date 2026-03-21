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

function getNextStatus(formData: FormData) {
  const intent = getString(formData, "intent");
  return intent === "publish" ? PostStatus.PUBLISHED : PostStatus.DRAFT;
}

function getValidationErrorCode(title: string, slug: string, content: string) {
  const errors = validatePostInput({ title, slug, content });

  if (errors.title) return "title-required";
  if (errors.content) return "content-required";
  if (errors.slug) return "slug-invalid";

  return null;
}

async function generateUniqueSlug(baseSlug: string, excludeId?: string) {
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: candidate },
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
  const inputSlug = getString(formData, "slug");
  const content = getString(formData, "content");
  const status = getNextStatus(formData);

  const validationErrorCode = getValidationErrorCode(title, inputSlug, content);

  if (validationErrorCode) {
    redirect(`/admin/posts/new?error=${validationErrorCode}`);
  }

  const baseSlug = resolveBaseSlug(inputSlug, title);

  if (!baseSlug) {
    redirect("/admin/posts/new?error=slug-invalid");
  }

  try {
    const slug = await generateUniqueSlug(baseSlug);

    const createdPost = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    revalidatePath("/admin/posts");
    revalidatePath("/posts");
    revalidatePath(`/posts/${createdPost.slug}`);

    if (status === PostStatus.PUBLISHED) {
      redirect("/admin/posts?status=created");
    }

    redirect(`/admin/posts/${createdPost.id}/edit?status=created`);
  } catch {
    redirect("/admin/posts/new?error=save-error");
  }
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
  const inputSlug = getString(formData, "slug");
  const content = getString(formData, "content");
  const status = getNextStatus(formData);

  const validationErrorCode = getValidationErrorCode(title, inputSlug, content);

  if (validationErrorCode) {
    redirect(`/admin/posts/${postId}/edit?error=${validationErrorCode}`);
  }

  const baseSlug = resolveBaseSlug(inputSlug, title);

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
        content,
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