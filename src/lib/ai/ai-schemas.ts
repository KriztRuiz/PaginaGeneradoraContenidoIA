import { z } from "zod";

export const AI_GENERATION_LIMITS = {
  topicMin: 3,
  topicMax: 160,
  contextMax: 2000,
  toneMax: 80,
  categoryNameMax: 80,

  titleMin: 8,
  titleMax: 120,

  excerptMin: 24,
  excerptMax: 220,

  contentMin: 320,
  contentMax: 12000,

  seoTitleMin: 12,
  seoTitleMax: 70,

  seoDescriptionMin: 50,
  seoDescriptionMax: 170,
} as const;

const requiredTrimmedText = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} es obligatorio.` })
    .trim()
    .min(min, `${label} debe tener al menos ${min} caracteres.`)
    .max(max, `${label} no puede exceder ${max} caracteres.`);

const optionalTrimmedText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(max).optional(),
  );

export const generatePostDraftInputSchema = z
  .object({
    topic: requiredTrimmedText(
      "El tema",
      AI_GENERATION_LIMITS.topicMin,
      AI_GENERATION_LIMITS.topicMax,
    ),
    context: optionalTrimmedText(AI_GENERATION_LIMITS.contextMax),
    tone: optionalTrimmedText(AI_GENERATION_LIMITS.toneMax),
    categoryName: optionalTrimmedText(AI_GENERATION_LIMITS.categoryNameMax),
  })
  .strict();

export type GeneratePostDraftInput = z.output<
  typeof generatePostDraftInputSchema
>;

export const generatedPostDraftSchema = z
  .object({
    title: requiredTrimmedText(
      "El título",
      AI_GENERATION_LIMITS.titleMin,
      AI_GENERATION_LIMITS.titleMax,
    ),
    excerpt: requiredTrimmedText(
      "El extracto",
      AI_GENERATION_LIMITS.excerptMin,
      AI_GENERATION_LIMITS.excerptMax,
    ),
    content: requiredTrimmedText(
      "El contenido",
      AI_GENERATION_LIMITS.contentMin,
      AI_GENERATION_LIMITS.contentMax,
    ),
    seoTitle: requiredTrimmedText(
      "El SEO title",
      AI_GENERATION_LIMITS.seoTitleMin,
      AI_GENERATION_LIMITS.seoTitleMax,
    ),
    seoDescription: requiredTrimmedText(
      "El SEO description",
      AI_GENERATION_LIMITS.seoDescriptionMin,
      AI_GENERATION_LIMITS.seoDescriptionMax,
    ),
    suggestedCategoryName: z.preprocess(
      (value) => {
        if (value === null || value === undefined) return undefined;
        if (typeof value !== "string") return undefined;

        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      },
      z.string().max(AI_GENERATION_LIMITS.categoryNameMax).optional(),
    ),
  })
  .strict();

export type GeneratedPostDraft = z.output<typeof generatedPostDraftSchema>;

export const GENERATED_POST_DRAFT_SCHEMA_NAME = "generated_post_draft";

export const generatedPostDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      minLength: AI_GENERATION_LIMITS.titleMin,
      maxLength: AI_GENERATION_LIMITS.titleMax,
      description: "Título claro, usable y directo para el post.",
    },
    excerpt: {
      type: "string",
      minLength: AI_GENERATION_LIMITS.excerptMin,
      maxLength: AI_GENERATION_LIMITS.excerptMax,
      description: "Extracto corto y útil para listados.",
    },
    content: {
      type: "string",
      minLength: AI_GENERATION_LIMITS.contentMin,
      maxLength: AI_GENERATION_LIMITS.contentMax,
      description:
        "Borrador base del artículo en texto limpio, con párrafos claros y sin relleno conversacional.",
    },
    seoTitle: {
      type: "string",
      minLength: AI_GENERATION_LIMITS.seoTitleMin,
      maxLength: AI_GENERATION_LIMITS.seoTitleMax,
      description: "Título SEO corto y razonable.",
    },
    seoDescription: {
      type: "string",
      minLength: AI_GENERATION_LIMITS.seoDescriptionMin,
      maxLength: AI_GENERATION_LIMITS.seoDescriptionMax,
      description: "Meta descripción breve, clara y útil.",
    },
    suggestedCategoryName: {
      type: ["string", "null"],
      maxLength: AI_GENERATION_LIMITS.categoryNameMax,
      description:
        "Nombre de categoría sugerida. Usa null si no hay una categoría clara o útil.",
    },
  },
  required: [
    "title",
    "excerpt",
    "content",
    "seoTitle",
    "seoDescription",
    "suggestedCategoryName",
  ],
} as const;

export type AiPostFormSeed = {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  categoryName?: string;
};