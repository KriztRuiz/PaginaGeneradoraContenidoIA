import OpenAI from "openai";

import {
  GENERATED_POST_DRAFT_FULL_SCHEMA_NAME,
  aiDraftRequestSchema,
  buildGeneratedPostPartialJsonSchema,
  buildGeneratedPostDraftPartialSchemaName,
  generatedPostDraftJsonSchema,
  type GenerateOrRegeneratePostDraftInput,
  type GeneratedPostDraft,
  type GeneratedPostDraftPartial,
} from "./ai-schemas";
import {
  AI_POST_DRAFT_SYSTEM_PROMPT,
  buildGeneratePostDraftUserPrompt,
  buildRegeneratePostDraftUserPrompt,
} from "./ai-prompts";
import {
  normalizeGeneratedPostDraft,
  normalizeRegeneratedPostDraft,
} from "./ai-mappers";

type GeneratePostDraftErrorCode =
  | "CONFIGURATION_ERROR"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE_ERROR";

export class GeneratePostDraftError extends Error {
  constructor(
    message: string,
    public readonly code: GeneratePostDraftErrorCode,
    public readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "GeneratePostDraftError";
  }
}

export type GeneratePostDraftResult =
  | {
      mode: "full";
      draft: GeneratedPostDraft;
      model: string;
      requestId: string | null;
    }
  | {
      mode: "partial";
      draft: GeneratedPostDraftPartial;
      model: string;
      requestId: string | null;
    };

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!apiKey) {
    throw new GeneratePostDraftError(
      "Falta la variable de entorno AI_API_KEY.",
      "CONFIGURATION_ERROR",
    );
  }

  if (!model) {
    throw new GeneratePostDraftError(
      "Falta la variable de entorno AI_MODEL.",
      "CONFIGURATION_ERROR",
    );
  }

  return { apiKey, model };
}

function parseGeneratedDraftJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    throw new GeneratePostDraftError(
      "La IA respondió en un formato JSON no válido.",
      "INVALID_RESPONSE_ERROR",
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringProp(value: unknown, ...keys: string[]): string | null {
  if (!isRecord(value)) return null;

  for (const key of keys) {
    const prop = value[key];
    if (typeof prop === "string" && prop.trim().length > 0) {
      return prop.trim();
    }
  }

  return null;
}

function getRequestIdFromResponse(response: unknown): string | null {
  return readStringProp(response, "_request_id", "request_id", "requestID", "id");
}

function getRequestIdFromError(error: unknown): string | null {
  return readStringProp(error, "requestID", "request_id", "_request_id");
}

const DEFAULT_REASONING_EFFORT: "low" = "low";
const DEFAULT_MAX_OUTPUT_TOKENS = 8000;

export async function generatePostDraft(
  rawInput: GenerateOrRegeneratePostDraftInput,
): Promise<GeneratePostDraftResult> {
  const input = aiDraftRequestSchema.parse(rawInput);
  const { apiKey, model } = getAiConfig();

  const client = new OpenAI({ apiKey });

  const responseFormat =
    input.mode === "full"
      ? {
          type: "json_schema" as const,
          name: GENERATED_POST_DRAFT_FULL_SCHEMA_NAME,
          strict: true,
          schema: generatedPostDraftJsonSchema,
        }
      : {
          type: "json_schema" as const,
          name: buildGeneratedPostDraftPartialSchemaName(input.targetFields),
          strict: true,
            schema: buildGeneratedPostPartialJsonSchema(input.targetFields),
        };

  const userPrompt =
    input.mode === "full"
      ? buildGeneratePostDraftUserPrompt(input)
      : buildRegeneratePostDraftUserPrompt(input);

  try {
    const response = await client.responses.create({
      model,
      store: false,
      reasoning: {
        effort: DEFAULT_REASONING_EFFORT,
      },
      max_output_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
      input: [
        {
          role: "system",
          content: AI_POST_DRAFT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      text: {
        format: responseFormat,
      },
    });

    const requestId = getRequestIdFromResponse(response);

    if (response.status === "incomplete") {
      const reason =
        response.incomplete_details &&
        typeof response.incomplete_details.reason === "string"
          ? response.incomplete_details.reason
          : null;

      if (reason === "max_output_tokens") {
        throw new GeneratePostDraftError(
          "La generación quedó incompleta por límite de tokens.",
          "UPSTREAM_ERROR",
          requestId,
        );
      }

      throw new GeneratePostDraftError(
        "La generación quedó incompleta.",
        "UPSTREAM_ERROR",
        requestId,
      );
    }

    const rawText =
      typeof response.output_text === "string"
        ? response.output_text.trim()
        : "";

    if (!rawText) {
      throw new GeneratePostDraftError(
        "La IA no devolvió texto utilizable.",
        "INVALID_RESPONSE_ERROR",
        requestId,
      );
    }

    const parsedJson = parseGeneratedDraftJson(rawText);

    if (input.mode === "full") {
      const draft = normalizeGeneratedPostDraft(parsedJson);

      return {
        mode: "full",
        draft,
        model,
        requestId,
      };
    }

    const draft = normalizeRegeneratedPostDraft(parsedJson, input.targetFields);

    return {
      mode: "partial",
      draft,
      model,
      requestId,
    };
  } catch (error) {
    if (error instanceof GeneratePostDraftError) {
      throw error;
    }

    if (error instanceof OpenAI.APIError) {
      throw new GeneratePostDraftError(
        error.message || "El proveedor de IA devolvió un error.",
        "UPSTREAM_ERROR",
        getRequestIdFromError(error),
      );
    }

    throw new GeneratePostDraftError(
      "No se pudo conectar con el proveedor de IA.",
      "UPSTREAM_ERROR",
      getRequestIdFromError(error),
    );
  }
}