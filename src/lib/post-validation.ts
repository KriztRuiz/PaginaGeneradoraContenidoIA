import { PostStatus } from "@prisma/client";
import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function isValidDateString(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export const postSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "El título es obligatorio.")
      .max(180, "El título no puede exceder 180 caracteres."),

    slug: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(200, "El slug no puede exceder 200 caracteres.")
        .regex(
          slugRegex,
          "El slug solo puede contener minúsculas, números y guiones medios."
        )
        .optional()
    ),

    excerpt: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(320, "El extracto no puede exceder 320 caracteres.")
        .optional()
    ),

    content: z
      .string()
      .trim()
      .min(1, "El contenido es obligatorio."),

    seoTitle: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(70, "El SEO title no puede exceder 70 caracteres.")
        .optional()
    ),

    seoDescription: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(160, "La SEO description no puede exceder 160 caracteres.")
        .optional()
    ),

    scheduledAt: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .refine(isValidDateString, "La fecha programada no es válida.")
        .optional()
    ),

    categoryId: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1, "La categoría no es válida.").optional()
    ),

    status: z
      .nativeEnum(PostStatus, {
        error: "El estado del post no es válido.",
      })
      .default(PostStatus.DRAFT),
  })
  .superRefine((data, ctx) => {
    if (data.status === PostStatus.SCHEDULED && !data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledAt"],
        message: "Debes indicar una fecha para programar la publicación.",
      });
    }
  });

export const postUpdateSchema = postSchema.extend({
  id: z
    .string()
    .trim()
    .min(1, "El id del post es obligatorio."),
});

export type PostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  categoryId?: string;
  status?: PostStatus;
};

export type PostUpdateInput = PostInput & {
  id: string;
};

export type NormalizedPostInput = z.output<typeof postSchema>;
export type NormalizedPostUpdateInput = z.output<typeof postUpdateSchema>;

export type PostValidationErrors = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  categoryId?: string;
  status?: string;
  general?: string;
};

export function validatePostInput(input: PostInput): PostValidationErrors {
  const result = postSchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    title: fieldErrors.title?.[0],
    slug: fieldErrors.slug?.[0],
    excerpt: fieldErrors.excerpt?.[0],
    content: fieldErrors.content?.[0],
    seoTitle: fieldErrors.seoTitle?.[0],
    seoDescription: fieldErrors.seoDescription?.[0],
    scheduledAt: fieldErrors.scheduledAt?.[0],
    categoryId: fieldErrors.categoryId?.[0],
    status: fieldErrors.status?.[0],
    general:
      result.error.issues.length > 0
        ? "Hay errores de validación."
        : undefined,
  };
}

export function validatePostUpdateInput(
  input: PostUpdateInput
): PostValidationErrors {
  const result = postUpdateSchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    title: fieldErrors.title?.[0],
    slug: fieldErrors.slug?.[0],
    excerpt: fieldErrors.excerpt?.[0],
    content: fieldErrors.content?.[0],
    seoTitle: fieldErrors.seoTitle?.[0],
    seoDescription: fieldErrors.seoDescription?.[0],
    scheduledAt: fieldErrors.scheduledAt?.[0],
    categoryId: fieldErrors.categoryId?.[0],
    status: fieldErrors.status?.[0],
    general:
      result.error.issues.length > 0
        ? "Hay errores de validación."
        : undefined,
  };
}

export function parsePostInput(input: PostInput): NormalizedPostInput {
  return postSchema.parse(input);
}

export function parsePostUpdateInput(
  input: PostUpdateInput
): NormalizedPostUpdateInput {
  return postUpdateSchema.parse(input);
}