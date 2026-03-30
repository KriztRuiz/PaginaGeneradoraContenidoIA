import type {
  AiPostFormSeed,
  GeneratedPostDraft,
} from "./ai-schemas";
import {
  AI_GENERATION_LIMITS,
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

export function normalizeGeneratedPostDraft(raw: unknown): GeneratedPostDraft {
  const parsed = generatedPostDraftSchema.parse(raw);

  const normalized: GeneratedPostDraft = {
    title: normalizeInlineText(parsed.title, AI_GENERATION_LIMITS.titleMax),
    excerpt: normalizeInlineText(
      parsed.excerpt,
      AI_GENERATION_LIMITS.excerptMax,
    ),
    content: normalizeBlockText(
      parsed.content,
      AI_GENERATION_LIMITS.contentMax,
    ),
    seoTitle: normalizeInlineText(
      parsed.seoTitle,
      AI_GENERATION_LIMITS.seoTitleMax,
    ),
    seoDescription: normalizeInlineText(
      parsed.seoDescription,
      AI_GENERATION_LIMITS.seoDescriptionMax,
    ),
    suggestedCategoryName: parsed.suggestedCategoryName
      ? normalizeInlineText(
          parsed.suggestedCategoryName,
          AI_GENERATION_LIMITS.categoryNameMax,
        )
      : undefined,
  };

  return generatedPostDraftSchema.parse(normalized);
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