import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre no puede exceder 80 caracteres."),

  slug: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(100, "El slug no puede exceder 100 caracteres.")
      .regex(
        slugRegex,
        "El slug solo puede contener minúsculas, números y guiones medios."
      )
      .optional()
  ),
});

export const categoryUpdateSchema = categorySchema.extend({
  id: z
    .string()
    .trim()
    .min(1, "El id de la categoría es obligatorio."),
});

export type CategoryInput = {
  name: string;
  slug?: string;
};

export type CategoryUpdateInput = CategoryInput & {
  id: string;
};

export type CategoryValidationErrors = {
  name?: string;
  slug?: string;
  general?: string;
};

export function validateCategoryInput(
  input: CategoryInput
): CategoryValidationErrors {
  const result = categorySchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    name: fieldErrors.name?.[0],
    slug: fieldErrors.slug?.[0],
    general:
      result.error.issues.length > 0
        ? "Hay errores de validación."
        : undefined,
  };
}

export function validateCategoryUpdateInput(
  input: CategoryUpdateInput
): CategoryValidationErrors {
  const result = categoryUpdateSchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    name: fieldErrors.name?.[0],
    slug: fieldErrors.slug?.[0],
    general:
      result.error.issues.length > 0
        ? "Hay errores de validación."
        : undefined,
  };
}