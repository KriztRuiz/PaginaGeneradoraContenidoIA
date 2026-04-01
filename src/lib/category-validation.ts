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
        "El slug solo puede contener minúsculas, números y guiones medios.",
      )
      .optional(),
  ),

  description: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(240, "La descripción no puede exceder 240 caracteres.")
      .optional(),
  ),
});

export const categoryUpdateSchema = categorySchema.extend({
  id: z.string().trim().min(1, "El id de la categoría es obligatorio."),
});

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
};

export type CategoryUpdateInput = CategoryInput & {
  id: string;
};

export type CategoryValidationErrors = {
  name?: string;
  slug?: string;
  description?: string;
  general?: string;
};

export type CategoryOptionLike = {
  id: string;
  name: string;
};

export function validateCategoryInput(
  input: CategoryInput,
): CategoryValidationErrors {
  const result = categorySchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    name: fieldErrors.name?.[0],
    slug: fieldErrors.slug?.[0],
    description: fieldErrors.description?.[0],
    general:
      result.error.issues.length > 0
        ? "Hay errores de validación."
        : undefined,
  };
}

export function validateCategoryUpdateInput(
  input: CategoryUpdateInput,
): CategoryValidationErrors {
  const result = categoryUpdateSchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    name: fieldErrors.name?.[0],
    slug: fieldErrors.slug?.[0],
    description: fieldErrors.description?.[0],
    general:
      result.error.issues.length > 0
        ? "Hay errores de validación."
        : undefined,
  };
}

export function normalizeCategoryText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeCategoryText(value: string) {
  return normalizeCategoryText(value).split(" ").filter(Boolean);
}

export function getCategoryMatchScore(categoryName: string, targetName: string) {
  const category = normalizeCategoryText(categoryName);
  const target = normalizeCategoryText(targetName);

  if (!category || !target) return 0;

  if (category === target) return 1;
  if (category.includes(target) || target.includes(category)) return 0.92;

  const categoryTokens = tokenizeCategoryText(categoryName);
  const targetTokens = tokenizeCategoryText(targetName);

  if (categoryTokens.length === 0 || targetTokens.length === 0) return 0;

  const sharedCount = targetTokens.filter((token) =>
    categoryTokens.includes(token),
  ).length;

  if (sharedCount === 0) return 0;

  return sharedCount / Math.max(categoryTokens.length, targetTokens.length);
}

export function findBestCategoryIdByName(
  categories: CategoryOptionLike[],
  categoryName?: string,
  minimumScore = 0.6,
) {
  if (!categoryName) return "";

  let bestId = "";
  let bestScore = 0;

  for (const category of categories) {
    const score = getCategoryMatchScore(category.name, categoryName);

    if (score > bestScore) {
      bestScore = score;
      bestId = category.id;
    }
  }

  return bestScore >= minimumScore ? bestId : "";
}