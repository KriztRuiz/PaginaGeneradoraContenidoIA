"use server";

import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { resolveBaseSlug } from "@/lib/slug";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNextStatus(formData: FormData) {
  const intent = getString(formData, "intent");
  return intent === "publish" ? PostStatus.PUBLISHED : PostStatus.DRAFT;
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

  if (!title || !content) {
    throw new Error("El título y el contenido son obligatorios.");
  }

  const baseSlug = resolveBaseSlug(inputSlug, title);

  if (!baseSlug) {
    throw new Error("No se pudo generar un slug válido.");
  }

  const slug = await generateUniqueSlug(baseSlug);

  const createdPost = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      status,
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/posts");
  revalidatePath(`/posts/${createdPost.slug}`);

  redirect("/admin/posts");
}

export async function updatePostAction(postId: string, formData: FormData) {
  await requireAdmin();

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    redirect("/admin/posts");
  }

  const title = getString(formData, "title");
  const inputSlug = getString(formData, "slug");
  const content = getString(formData, "content");
  const status = getNextStatus(formData);

  if (!title || !content) {
    throw new Error("El título y el contenido son obligatorios.");
  }

  const baseSlug = resolveBaseSlug(inputSlug, title);

  if (!baseSlug) {
    throw new Error("No se pudo generar un slug válido.");
  }

  const slug = await generateUniqueSlug(baseSlug, existingPost.id);

  const updatedPost = await prisma.post.update({
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
  });

  revalidatePath("/admin/posts");
  revalidatePath("/posts");
  revalidatePath(`/posts/${existingPost.slug}`);
  revalidatePath(`/posts/${updatedPost.slug}`);

  redirect("/admin/posts");
}