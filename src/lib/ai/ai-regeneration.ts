// src/lib/ai/ai-regeneration.ts

export const REGENERABLE_FIELDS = [
  "title",
  "excerpt",
  "content",
  "seoTitle",
  "seoDescription",
] as const;

export type RegenerableField = (typeof REGENERABLE_FIELDS)[number];

export type AiGenerationMode = "full" | "partial";

export type DraftFormValues = {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  suggestedCategoryName?: string | null;
};

export type CurrentDraftContext = Partial<DraftFormValues>;

export type PartialDraftResult = Partial<Pick<DraftFormValues, RegenerableField>>;

export function isRegenerableField(value: string): value is RegenerableField {
  return REGENERABLE_FIELDS.includes(value as RegenerableField);
}

export function sanitizeDraftText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function sanitizePartialDraft(
  input: Partial<Record<RegenerableField, unknown>>,
): PartialDraftResult {
  const output: PartialDraftResult = {};

  for (const field of REGENERABLE_FIELDS) {
    const value = sanitizeDraftText(input[field]);
    if (value) {
      output[field] = value;
    }
  }

  return output;
}

export function mergeDraftFields(
  current: CurrentDraftContext,
  incoming: PartialDraftResult,
): DraftFormValues {
  return {
    title: incoming.title ?? current.title ?? "",
    excerpt: incoming.excerpt ?? current.excerpt ?? "",
    content: incoming.content ?? current.content ?? "",
    seoTitle: incoming.seoTitle ?? current.seoTitle ?? "",
    seoDescription: incoming.seoDescription ?? current.seoDescription ?? "",
    suggestedCategoryName: current.suggestedCategoryName ?? null,
  };
}

export function pickDraftContextForPrompt(
  current: CurrentDraftContext,
): DraftFormValues {
  return {
    title: current.title?.trim() ?? "",
    excerpt: current.excerpt?.trim() ?? "",
    content: current.content?.trim() ?? "",
    seoTitle: current.seoTitle?.trim() ?? "",
    seoDescription: current.seoDescription?.trim() ?? "",
    suggestedCategoryName: current.suggestedCategoryName?.trim() ?? null,
  };
}