import { z } from "zod";

export const AI_REGENERABLE_FIELDS = [
  "title",
  "excerpt",
  "content",
  "seoTitle",
  "seoDescription",
] as const;

export type AiRegenerableField = (typeof AI_REGENERABLE_FIELDS)[number];
export type AiGenerationMode = "full" | "partial";

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

function buildRequiredFieldSchema(field: AiRegenerableField) {
  switch (field) {
    case "title":
      return requiredTrimmedText(
        "El título",
        AI_GENERATION_LIMITS.titleMin,
        AI_GENERATION_LIMITS.titleMax,
      );
    case "excerpt":
      return requiredTrimmedText(
        "El extracto",
        AI_GENERATION_LIMITS.excerptMin,
        AI_GENERATION_LIMITS.excerptMax,
      );
    case "content":
      return requiredTrimmedText(
        "El contenido",
        AI_GENERATION_LIMITS.contentMin,
        AI_GENERATION_LIMITS.contentMax,
      );
    case "seoTitle":
      return requiredTrimmedText(
        "El SEO title",
        AI_GENERATION_LIMITS.seoTitleMin,
        AI_GENERATION_LIMITS.seoTitleMax,
      );
    case "seoDescription":
      return requiredTrimmedText(
        "El SEO description",
        AI_GENERATION_LIMITS.seoDescriptionMin,
        AI_GENERATION_LIMITS.seoDescriptionMax,
      );
    default: {
      const exhaustiveCheck: never = field;
      return exhaustiveCheck;
    }
  }
}

export const currentDraftContextSchema = z
  .object({
    title: optionalTrimmedText(AI_GENERATION_LIMITS.titleMax),
    excerpt: optionalTrimmedText(AI_GENERATION_LIMITS.excerptMax),
    content: optionalTrimmedText(AI_GENERATION_LIMITS.contentMax),
    seoTitle: optionalTrimmedText(AI_GENERATION_LIMITS.seoTitleMax),
    seoDescription: optionalTrimmedText(AI_GENERATION_LIMITS.seoDescriptionMax),
  })
  .strict();

export type AiCurrentDraftContext = z.output<typeof currentDraftContextSchema>;

export const generatePostDraftInputSchema = z
  .object({
    mode: z.literal("full"),
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

export const regeneratePostDraftInputSchema = z
  .object({
    mode: z.literal("partial"),
    topic: requiredTrimmedText(
      "El tema",
      AI_GENERATION_LIMITS.topicMin,
      AI_GENERATION_LIMITS.topicMax,
    ),
    context: optionalTrimmedText(AI_GENERATION_LIMITS.contextMax),
    tone: optionalTrimmedText(AI_GENERATION_LIMITS.toneMax),
    categoryName: optionalTrimmedText(AI_GENERATION_LIMITS.categoryNameMax),
    currentDraft: currentDraftContextSchema,
    targetFields: z
      .array(z.enum(AI_REGENERABLE_FIELDS), {
        error: "Selecciona al menos un campo para regenerar.",
      })
      .min(1, "Selecciona al menos un campo para regenerar.")
      .transform((values) => [...new Set(values)]),
  })
  .strict();

export type RegeneratePostDraftInput = z.output<
  typeof regeneratePostDraftInputSchema
>;

export const aiDraftRequestSchema = z.discriminatedUnion("mode", [
  generatePostDraftInputSchema,
  regeneratePostDraftInputSchema,
]);

export type GenerateOrRegeneratePostDraftInput = z.output<
  typeof aiDraftRequestSchema
>;

export const generatedPostDraftSchema = z
  .object({
    title: buildRequiredFieldSchema("title"),
    excerpt: buildRequiredFieldSchema("excerpt"),
    content: buildRequiredFieldSchema("content"),
    seoTitle: buildRequiredFieldSchema("seoTitle"),
    seoDescription: buildRequiredFieldSchema("seoDescription"),
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

export function buildGeneratedPostPartialSchema(
  targetFields: readonly AiRegenerableField[],
) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of [...new Set(targetFields)]) {
    shape[field] = buildRequiredFieldSchema(field);
  }

  return z.object(shape).strict();
}

export type GeneratedPostDraftPartial = Partial<
  Pick<GeneratedPostDraft, AiRegenerableField>
>;

export const GENERATED_POST_DRAFT_FULL_SCHEMA_NAME =
  "generated_post_draft_full";

export function buildGeneratedPostDraftPartialSchemaName(
  targetFields: readonly AiRegenerableField[],
) {
  const suffix = [...new Set(targetFields)].join("_") || "fields";
  return `generated_post_draft_partial_${suffix}`.slice(0, 64);
}

const generatedPostDraftJsonSchemaProperties = {
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
} as const;

export const generatedPostDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: generatedPostDraftJsonSchemaProperties,
  required: [
    "title",
    "excerpt",
    "content",
    "seoTitle",
    "seoDescription",
    "suggestedCategoryName",
  ],
} as const;

export function buildGeneratedPostPartialJsonSchema(
  targetFields: readonly AiRegenerableField[],
) {
  const uniqueFields = [...new Set(targetFields)];

  const properties = Object.fromEntries(
    uniqueFields.map((field) => [field, generatedPostDraftJsonSchemaProperties[field]]),
  );

  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: uniqueFields,
  } as const;
}

export type AiPostFormSeed = {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  categoryName?: string;
};

export type AiPostFormPatch = Partial<AiPostFormSeed>;

export type AiPostFormSnapshot = {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  categoryName?: string;
};