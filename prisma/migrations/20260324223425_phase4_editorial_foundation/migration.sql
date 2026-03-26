-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PostStatus" ADD VALUE 'PENDING';
ALTER TYPE "PostStatus" ADD VALUE 'SCHEDULED';
ALTER TYPE "PostStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- CreateTable
CREATE TABLE "PostRevision" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "editorId" TEXT,
    "action" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostRevision_postId_createdAt_idx" ON "PostRevision"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_slug_idx" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "Post_publishedAt_idx" ON "Post"("publishedAt");

-- CreateIndex
CREATE INDEX "Post_scheduledAt_idx" ON "Post"("scheduledAt");

-- AddForeignKey
ALTER TABLE "PostRevision" ADD CONSTRAINT "PostRevision_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
