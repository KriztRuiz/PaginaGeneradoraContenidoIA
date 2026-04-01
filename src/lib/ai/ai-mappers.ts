import type {
  AiCurrentDraftContext,
  AiPostFormPatch,
  AiPostFormSeed,
  AiPostFormSnapshot,
  AiRegenerableField,
  GeneratedPostDraft,
  GeneratedPostDraftPartial,
} from "./ai-schemas";
import {
  AI_GENERATION_LIMITS,
  buildGeneratedPostPartialSchema,
  generatedPostDraftSchema,
} from "./ai-schemas";

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function collapseInlineWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function collapseBlockWhitespace(value: string): string {
  return normalizeLineBreaks(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function clampText(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function normalizeInlineText(value: string, max: number): string {
  return clampText(collapseInlineWhitespace(value), max);
}

function normalizeBlockText(value: string, max: number): string {
  return clampText(collapseBlockWhitespace(value), max);
}

function normalizeFieldValue(field: AiRegenerableField, value: string) {
  switch (field) {
    case "title":
      return normalizeInlineText(value, AI_GENERATION_LIMITS.titleMax);
    case "excerpt":
      return normalizeInlineText(value, AI_GENERATION_LIMITS.excerptMax);
    case "content":
      return normalizeBlockText(value, AI_GENERATION_LIMITS.contentMax);
    case "seoTitle":
      return normalizeInlineText(value, AI_GENERATION_LIMITS.seoTitleMax);
    case "seoDescription":
      return normalizeInlineText(value, AI_GENERATION_LIMITS.seoDescriptionMax);
    default: {
      const exhaustiveCheck: never = field;
      return exhaustiveCheck;
    }
  }
}

export function normalizeGeneratedPostDraft(raw: unknown): GeneratedPostDraft {
  const parsed = generatedPostDraftSchema.parse(raw);

  const normalized: GeneratedPostDraft = {
    title: normalizeFieldValue("title", parsed.title),
    excerpt: normalizeFieldValue("excerpt", parsed.excerpt),
    content: normalizeFieldValue("content", parsed.content),
    seoTitle: normalizeFieldValue("seoTitle", parsed.seoTitle),
    seoDescription: normalizeFieldValue("seoDescription", parsed.seoDescription),
    suggestedCategoryName: parsed.suggestedCategoryName
      ? normalizeInlineText(
          parsed.suggestedCategoryName,
          AI_GENERATION_LIMITS.categoryNameMax,
        )
      : undefined,
  };

  return generatedPostDraftSchema.parse(normalized);
}

export function normalizeRegeneratedPostDraft(
  raw: unknown,
  targetFields: readonly AiRegenerableField[],
): GeneratedPostDraftPartial {
  const partialSchema = buildGeneratedPostPartialSchema(targetFields);
  const parsed = partialSchema.parse(raw);

  const normalizedEntries = Object.entries(parsed).map(([field, value]) => [
    field,
    normalizeFieldValue(field as AiRegenerableField, String(value)),
  ]);

  return partialSchema.parse(Object.fromEntries(normalizedEntries));
}

export function mapGeneratedDraftToPostFormSeed(
  draft: GeneratedPostDraft,
): AiPostFormSeed {
  return {
    title: draft.title,
    excerpt: draft.excerpt,
    content: draft.content,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    categoryName: draft.suggestedCategoryName,
  };
}

export function mapRegeneratedDraftToPostFormPatch(
  draft: GeneratedPostDraftPartial,
): AiPostFormPatch {
  return {
    ...(typeof draft.title === "string" ? { title: draft.title } : {}),
    ...(typeof draft.excerpt === "string" ? { excerpt: draft.excerpt } : {}),
    ...(typeof draft.content === "string" ? { content: draft.content } : {}),
    ...(typeof draft.seoTitle === "string" ? { seoTitle: draft.seoTitle } : {}),
    ...(typeof draft.seoDescription === "string"
      ? { seoDescription: draft.seoDescription }
      : {}),
  };
}

export function pickAiCurrentDraftContext(
  snapshot?: AiPostFormSnapshot | null,
): AiCurrentDraftContext {
  if (!snapshot) {
    return {};
  }

  return {
    title: snapshot.title.trim() || undefined,
    excerpt: snapshot.excerpt.trim() || undefined,
    content: snapshot.content.trim() || undefined,
    seoTitle: snapshot.seoTitle.trim() || undefined,
    seoDescription: snapshot.seoDescription.trim() || undefined,
  };
}

export function hasAnyDraftContent(snapshot?: AiPostFormSnapshot | null) {
  if (!snapshot) return false;

  return [
    snapshot.title,
    snapshot.excerpt,
    snapshot.content,
    snapshot.seoTitle,
    snapshot.seoDescription,
  ].some((value) => value.trim().length > 0);
}