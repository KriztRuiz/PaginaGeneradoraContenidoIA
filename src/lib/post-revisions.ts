import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PostRevisionDbClient = PrismaClient | Prisma.TransactionClient;

type CreatePostRevisionInput = {
  postId: string;
  editorId?: string | null;
  action: string;
  snapshot: Prisma.InputJsonValue;
};

export async function createPostRevision(
  { postId, editorId, action, snapshot }: CreatePostRevisionInput,
  db: PostRevisionDbClient = prisma
) {
  return db.postRevision.create({
    data: {
      postId,
      editorId: editorId ?? null,
      action,
      snapshotJson: snapshot,
    },
  });
}