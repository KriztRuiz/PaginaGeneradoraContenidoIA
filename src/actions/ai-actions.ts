"use server";

import { ZodError } from "zod";

import { auth } from "@/auth";
import {
  mapGeneratedDraftToPostFormSeed,
  mapRegeneratedDraftToPostFormPatch,
} from "@/lib/ai/ai-mappers";
import {
  AI_REGENERABLE_FIELDS,
  aiDraftRequestSchema,
  type AiPostFormPatch,
  type AiPostFormSeed,
  type AiRegenerableField,
  type GenerateOrRegeneratePostDraftInput,
} from "@/lib/ai/ai-schemas";
import {
  GeneratePostDraftError,
  generatePostDraft,
} from "@/lib/ai/generate-post-draft";

type GenerateDraftFieldErrors = Partial<
  Record<"topic" | "context" | "tone" | "categoryName" | "targetFields", string[]>
>;

export type GeneratePostDraftActionResult =
  | {
      ok: true;
      mode: "full" | "partial";
      data: AiPostFormSeed | AiPostFormPatch;
      changedFields: AiRegenerableField[];
      meta: {
        model: string;
        requestId: string | null;
      };
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: GenerateDraftFieldErrors;
    };

function mapZodFieldErrors(error: ZodError): GenerateDraftFieldErrors {
  const fieldErrors: GenerateDraftFieldErrors = {};

  for (const issue of error.issues) {
    const rawKey = issue.path[0];
    if (typeof rawKey !== "string") continue;

    const allowedKeys = new Set([
      "topic",
      "context",
      "tone",
      "categoryName",
      "targetFields",
    ]);

    if (!allowedKeys.has(rawKey)) continue;

    const key = rawKey as keyof GenerateDraftFieldErrors;

    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }

    fieldErrors[key]!.push(issue.message);
  }

  return fieldErrors;
}

function buildFriendlyErrorMessage(error: GeneratePostDraftError): string {
  const raw = error.message.toLowerCase();

  if (
    raw.includes("exceeded your current quota") ||
    raw.includes("billing details") ||
    raw.includes("insufficient_quota")
  ) {
    return "La generación con IA no está disponible porque la cuenta de la API no tiene cuota o facturación activa.";
  }

  switch (error.code) {
    case "CONFIGURATION_ERROR":
      return "La configuración de IA no está completa en el servidor.";
    case "UPSTREAM_ERROR":
      return "No se pudo generar el borrador en este momento. Intenta de nuevo.";
    case "INVALID_RESPONSE_ERROR":
      return "La IA devolvió una respuesta inválida. Intenta generar nuevamente.";
    default:
      return "Ocurrió un error al generar el borrador.";
  }
}

function formatActionError(error: unknown): string {
  if (error instanceof GeneratePostDraftError) {
    const friendlyMessage = buildFriendlyErrorMessage(error);

    if (process.env.NODE_ENV !== "production") {
      const detailParts = [error.message];

      if (error.requestId) {
        detailParts.push(`requestId: ${error.requestId}`);
      }

      return `${friendlyMessage} Detalle técnico: ${detailParts.join(" | ")}`;
    }

    return friendlyMessage;
  }

  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    return `Ocurrió un error inesperado al generar el borrador. Detalle técnico: ${error.message}`;
  }

  return "Ocurrió un error inesperado al generar el borrador.";
}

export async function generatePostDraftAction(
  rawInput: unknown,
): Promise<GeneratePostDraftActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      error: "Tu sesión no es válida. Inicia sesión nuevamente.",
    };
  }

  try {
    const input = aiDraftRequestSchema.parse(
      rawInput,
    ) as GenerateOrRegeneratePostDraftInput;

    const result = await generatePostDraft(input);

    if (result.mode === "full") {
      const formSeed = mapGeneratedDraftToPostFormSeed(result.draft);

      return {
        ok: true,
        mode: "full",
        data: formSeed,
        changedFields: [...AI_REGENERABLE_FIELDS],
        meta: {
          model: result.model,
          requestId: result.requestId,
        },
      };
    }

    const formPatch = mapRegeneratedDraftToPostFormPatch(result.draft);
    const changedFields = Object.keys(formPatch).filter((field) =>
      AI_REGENERABLE_FIELDS.includes(field as AiRegenerableField),
    ) as AiRegenerableField[];

    return {
      ok: true,
      mode: "partial",
      data: formPatch,
      changedFields,
      meta: {
        model: result.model,
        requestId: result.requestId,
      },
    };
  } catch (error) {
    console.error("[generatePostDraftAction] Error al generar borrador:", error);

    if (error instanceof ZodError) {
      return {
        ok: false,
        error: "Revisa los datos del formulario antes de continuar.",
        fieldErrors: mapZodFieldErrors(error),
      };
    }

    return {
      ok: false,
      error: formatActionError(error),
    };
  }
}