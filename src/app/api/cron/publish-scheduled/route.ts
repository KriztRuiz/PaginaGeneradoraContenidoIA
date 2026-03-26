import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPostRevision } from "@/lib/post-revisions";

const scheduledPostSelect = {
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

type ScheduledPostRecord = {
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

function buildSnapshot(post: ScheduledPostRecord) {
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

function getAuthToken(request: NextRequest) {
  const bearer = request.headers.get("authorization");

  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }

  const headerToken = request.headers.get("x-cron-secret");
  return headerToken?.trim() ?? "";
}

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return {
      ok: false,
      reason: "CRON_SECRET no está configurado en variables de entorno.",
    };
  }

  const receivedToken = getAuthToken(request);

  if (!receivedToken || receivedToken !== expectedSecret) {
    return {
      ok: false,
      reason: "No autorizado.",
    };
  }

  return {
    ok: true,
    reason: null,
  };
}

export async function POST(request: NextRequest) {
  const auth = isAuthorized(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: auth.reason,
      },
      { status: 401 }
    );
  }

  const now = new Date();

  const duePosts = await prisma.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledAt: {
        lte: now,
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (duePosts.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      message: "No hay posts programados listos para publicar.",
    });
  }

  const publishedSlugs: string[] = [];
  const publishedIds: string[] = [];

  for (const duePost of duePosts) {
    const updatedPost = await prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id: duePost.id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: now,
          scheduledAt: null,
        },
        select: scheduledPostSelect,
      });

      await createPostRevision(
        {
          postId: updated.id,
          editorId: null,
          action: "AUTO_PUBLISHED",
          snapshot: buildSnapshot(updated),
        },
        tx
      );

      return updated;
    });

    publishedIds.push(updatedPost.id);
    publishedSlugs.push(updatedPost.slug);
  }

  revalidatePath("/posts");

  for (const slug of publishedSlugs) {
    revalidatePath(`/posts/${slug}`);
  }

  revalidatePath("/admin/posts");

  return NextResponse.json({
    ok: true,
    processed: publishedIds.length,
    postIds: publishedIds,
    slugs: publishedSlugs,
    publishedAt: now.toISOString(),
  });
}