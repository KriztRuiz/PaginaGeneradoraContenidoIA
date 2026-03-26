"use server";

import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { resolveBaseSlug } from "@/lib/slug";
import { validatePostInput } from "@/lib/post-validation";
import {
  isPublishedStatus,
  isScheduledStatus,
  resolveRequestedPostStatus,
} from "@/lib/post-status";
import { createPostRevision } from "@/lib/post-revisions";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value === "" ? undefined : value;
}

function getRequestedStatus(formData: FormData) {
  const rawStatus = getOptionalString(formData, "status");
  const intent = getString(formData, "intent");

  return resolveRequestedPostStatus(rawStatus, intent);
}

function getEditorId(admin: unknown): string | null {
  if (!admin || typeof admin !== "object") {
    return null;
  }

  if ("id" in admin && typeof admin.id === "string") {
    return admin.id;
  }

  if (
    "user" in admin &&
    admin.user &&
    typeof admin.user === "object" &&
    "id" in admin.user &&
    typeof admin.user.id === "string"
  ) {
    return admin.user.id;
  }

  return null;
}

function parseOptionalDate(value?: string) {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getValidationErrorCode(input: {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  categoryId?: string;
  status: PostStatus;
}) {
  const errors = validatePostInput(input);

  if (errors.title) return "title-required";
  if (errors.content) return "content-required";
  if (errors.slug) return "slug-invalid";
  if (errors.excerpt) return "excerpt-invalid";
  if (errors.seoTitle) return "seo-title-invalid";
  if (errors.seoDescription) return "seo-description-invalid";
  if (errors.scheduledAt) return "scheduled-at-invalid";
  if (errors.categoryId) return "category-invalid";
  if (errors.status) return "status-invalid";

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

const postSnapshotSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  seoTitle: true,
  seoDescription: true,
  status: true,
  publishedAt: true,
  scheduledAt: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PostSnapshotRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function buildSnapshot(post: PostSnapshotRecord) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    categoryId: post.categoryId,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function resolveRevisionActionForCreate(status: PostStatus) {
  if (status === PostStatus.PUBLISHED) return "PUBLISHED";
  if (status === PostStatus.SCHEDULED) return "SCHEDULED";
  if (status === PostStatus.REJECTED) return "REJECTED";
  return "CREATED";
}

function resolveRevisionActionForUpdate(
  previousStatus: PostStatus,
  nextStatus: PostStatus
) {
  if (nextStatus !== previousStatus) {
    if (nextStatus === PostStatus.PUBLISHED) return "PUBLISHED";
    if (nextStatus === PostStatus.SCHEDULED) return "SCHEDULED";
    if (nextStatus === PostStatus.REJECTED) return "REJECTED";
    return "STATUS_CHANGED";
  }

  return "UPDATED";
}

function resolvePublishedAtForCreate(status: PostStatus) {
  return isPublishedStatus(status) ? new Date() : null;
}

function resolvePublishedAtForUpdate(
  status: PostStatus,
  existingPublishedAt: Date | null
) {
  if (isPublishedStatus(status)) {
    return existingPublishedAt ?? new Date();
  }

  return null;
}

function resolveScheduledAt(status: PostStatus, scheduledAt: Date | null) {
  return isScheduledStatus(status) ? scheduledAt : null;
}

function revalidatePostPaths(slug: string, previousSlug?: string) {
  revalidatePath("/admin/posts");
  revalidatePath("/posts");

  if (previousSlug) {
    revalidatePath(`/posts/${previousSlug}`);
  }

  revalidatePath(`/posts/${slug}`);
}

export async function createPostAction(formData: FormData) {
  const admin = await requireAdmin();
  const editorId = getEditorId(admin);

  const title = getString(formData, "title");
  const inputSlug = getOptionalString(formData, "slug");
  const excerpt = getOptionalString(formData, "excerpt");
  const content = getString(formData, "content");
  const seoTitle = getOptionalString(formData, "seoTitle");
  const seoDescription = getOptionalString(formData, "seoDescription");
  const scheduledAtInput = getOptionalString(formData, "scheduledAt");
  const categoryId = getOptionalString(formData, "categoryId");
  const status = getRequestedStatus(formData);

  const validationErrorCode = getValidationErrorCode({
    title,
    slug: inputSlug,
    excerpt,
    content,
    seoTitle,
    seoDescription,
    scheduledAt: scheduledAtInput,
    categoryId,
    status,
  });

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

  const scheduledAt = parseOptionalDate(scheduledAtInput);

  let createdPost: { id: string; slug: string };

  try {
    const slug = await generateUniqueSlug(baseSlug);

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          title,
          slug,
          excerpt,
          content,
          seoTitle: seoTitle ?? null,
          seoDescription: seoDescription ?? null,
          categoryId: categoryId ?? null,
          status,
          scheduledAt: resolveScheduledAt(status, scheduledAt),
          publishedAt: resolvePublishedAtForCreate(status),
          createdById: editorId,
          updatedById: editorId,
        },
        select: postSnapshotSelect,
      });

      await createPostRevision(
        {
          postId: created.id,
          editorId,
          action: resolveRevisionActionForCreate(status),
          snapshot: buildSnapshot(created),
        },
        tx
      );

      return {
        id: created.id,
        slug: created.slug,
      };
    });

    createdPost = post;
  } catch {
    redirect("/admin/posts/new?error=save-error");
  }

  revalidatePostPaths(createdPost.slug);

  if (status === PostStatus.PUBLISHED) {
    redirect("/admin/posts?status=created");
  }

  redirect(`/admin/posts/${createdPost.id}/edit?status=created`);
}

export async function updatePostAction(postId: string, formData: FormData) {
  const admin = await requireAdmin();
  const editorId = getEditorId(admin);

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      status: true,
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
  const seoTitle = getOptionalString(formData, "seoTitle");
  const seoDescription = getOptionalString(formData, "seoDescription");
  const scheduledAtInput = getOptionalString(formData, "scheduledAt");
  const categoryId = getOptionalString(formData, "categoryId");
  const status = getRequestedStatus(formData);

  const validationErrorCode = getValidationErrorCode({
    title,
    slug: inputSlug,
    excerpt,
    content,
    seoTitle,
    seoDescription,
    scheduledAt: scheduledAtInput,
    categoryId,
    status,
  });

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

  const scheduledAt = parseOptionalDate(scheduledAtInput);

  let updatedPost: { id: string; slug: string };

  try {
    const slug = await generateUniqueSlug(baseSlug, existingPost.id);

    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id: existingPost.id },
        data: {
          title,
          slug,
          excerpt,
          content,
          seoTitle: seoTitle ?? null,
          seoDescription: seoDescription ?? null,
          categoryId: categoryId ?? null,
          status,
          scheduledAt: resolveScheduledAt(status, scheduledAt),
          publishedAt: resolvePublishedAtForUpdate(
            status,
            existingPost.publishedAt
          ),
          updatedById: editorId,
        },
        select: postSnapshotSelect,
      });

      await createPostRevision(
        {
          postId: updated.id,
          editorId,
          action: resolveRevisionActionForUpdate(existingPost.status, status),
          snapshot: buildSnapshot(updated),
        },
        tx
      );

      return {
        id: updated.id,
        slug: updated.slug,
      };
    });

    updatedPost = post;
  } catch {
    redirect(`/admin/posts/${postId}/edit?error=save-error`);
  }

  revalidatePostPaths(updatedPost.slug, existingPost.slug);
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

  revalidatePostPaths(post.slug);
  redirect("/admin/posts?status=deleted");
}