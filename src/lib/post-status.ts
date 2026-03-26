import { PostStatus } from "@prisma/client";

const POST_STATUS_VALUES = Object.values(PostStatus) as PostStatus[];

export function isPostStatus(value: unknown): value is PostStatus {
  return typeof value === "string" && POST_STATUS_VALUES.includes(value as PostStatus);
}

export function getFallbackPostStatusFromIntent(intent?: string): PostStatus {
  return intent === "publish" ? PostStatus.PUBLISHED : PostStatus.DRAFT;
}

export function resolveRequestedPostStatus(
  rawStatus: unknown,
  rawIntent?: string
): PostStatus {
  if (isPostStatus(rawStatus)) {
    return rawStatus;
  }

  return getFallbackPostStatusFromIntent(
    typeof rawIntent === "string" ? rawIntent.trim() : ""
  );
}

export function isPublishedStatus(status: PostStatus) {
  return status === PostStatus.PUBLISHED;
}

export function isScheduledStatus(status: PostStatus) {
  return status === PostStatus.SCHEDULED;
}