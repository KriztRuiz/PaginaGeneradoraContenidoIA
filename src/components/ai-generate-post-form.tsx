"use client";

import { useMemo, useState, useTransition } from "react";

import {
  generatePostDraftAction,
  type GeneratePostDraftActionResult,
} from "@/actions/ai-actions";
import type { AiPostFormSeed } from "@/lib/ai/ai-schemas";

type GeneratePostFormValues = {
  topic: string;
  context: string;
  tone: string;
  categoryName: string;
};

type GeneratePostFormFieldErrors = Partial<
  Record<keyof GeneratePostFormValues, string>
>;

type AIGeneratePostFormProps = {
  onGenerated: (data: AiPostFormSeed) => void;
  disabled?: boolean;
};

const INITIAL_VALUES: GeneratePostFormValues = {
  topic: "",
  context: "",
  tone: "",
  categoryName: "",
};

const TONE_OPTIONS = [
  "Profesional",
  "Informativo",
  "Cercano",
  "Persuasivo",
  "Serio",
  "Neutral",
];

type UiStatus = "idle" | "generating" | "success" | "error";

function trimOrEmpty(value: string) {
  return value.trim();
}

function validateClient(values: GeneratePostFormValues): GeneratePostFormFieldErrors {
  const errors: GeneratePostFormFieldErrors = {};

  const topic = trimOrEmpty(values.topic);
  const context = trimOrEmpty(values.context);
  const tone = trimOrEmpty(values.tone);
  const categoryName = trimOrEmpty(values.categoryName);

  if (!topic) {
    errors.topic = "El tema es obligatorio.";
  } else if (topic.length < 3) {
    errors.topic = "El tema debe tener al menos 3 caracteres.";
  } else if (topic.length > 160) {
    errors.topic = "El tema no puede exceder 160 caracteres.";
  }

  if (context.length > 2000) {
    errors.context = "El contexto no puede exceder 2000 caracteres.";
  }

  if (tone.length > 80) {
    errors.tone = "El tono no puede exceder 80 caracteres.";
  }

  if (categoryName.length > 80) {
    errors.categoryName = "La categoría no puede exceder 80 caracteres.";
  }

  return errors;
}

function hasErrors(errors: GeneratePostFormFieldErrors) {
  return Object.keys(errors).length > 0;
}

function mapServerFieldErrors(
  result: Extract<GeneratePostDraftActionResult, { ok: false }>,
): GeneratePostFormFieldErrors {
  return {
    topic: result.fieldErrors?.topic?.[0],
    context: result.fieldErrors?.context?.[0],
    tone: result.fieldErrors?.tone?.[0],
    categoryName: result.fieldErrors?.categoryName?.[0],
  };
}

function getStatusLabel(status: UiStatus) {
  switch (status) {
    case "idle":
      return "Listo";
    case "generating":
      return "Generando";
    case "success":
      return "Generado";
    case "error":
      return "Error";
    default:
      return "Listo";
  }
}

export function AIGeneratePostForm({
  onGenerated,
  disabled = false,
}: AIGeneratePostFormProps) {
  const [values, setValues] = useState<GeneratePostFormValues>(INITIAL_VALUES);
  const [status, setStatus] = useState<UiStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<GeneratePostFormFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const isBlocked = disabled || isPending;

  const statusLabel = useMemo(() => getStatusLabel(status), [status]);

  function updateField<K extends keyof GeneratePostFormValues>(
    key: K,
    value: GeneratePostFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setFieldErrors((current) => {
      if (!current[key]) return current;
      return {
        ...current,
        [key]: undefined,
      };
    });

    if (status === "error") {
      setStatus("idle");
    }

    if (serverError) {
      setServerError(null);
    }

    if (successMessage) {
      setSuccessMessage(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBlocked) {
      return;
    }

    const clientErrors = validateClient(values);
    setFieldErrors(clientErrors);
    setServerError(null);
    setSuccessMessage(null);

    if (hasErrors(clientErrors)) {
      setStatus("error");
      return;
    }

    setStatus("generating");

    startTransition(async () => {
      const result = await generatePostDraftAction({
        topic: values.topic,
        context: values.context,
        tone: values.tone,
        categoryName: values.categoryName,
      });

      if (!result.ok) {
        setFieldErrors(mapServerFieldErrors(result));
        setServerError(result.error);
        setSuccessMessage(null);
        setStatus("error");
        return;
      }

      onGenerated(result.data);
      setFieldErrors({});
      setServerError(null);
      setLastModel(result.meta.model);
      setSuccessMessage(
        "Se generó un borrador editable y se cargó en el formulario principal.",
      );
      setStatus("success");
    });
  }

  function handleReset() {
    if (isBlocked) {
      return;
    }

    setValues(INITIAL_VALUES);
    setFieldErrors({});
    setServerError(null);
    setSuccessMessage(null);
    setStatus("idle");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Generar borrador con IA
          </h2>
          <p className="text-sm text-slate-600">
            Esto genera un borrador editable para el formulario de post. No publica
            automáticamente.
          </p>
        </div>

        <div className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
          Estado: {statusLabel}
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} aria-busy={isPending}>
        <div className="space-y-2">
          <label
            htmlFor="ai-topic"
            className="block text-sm font-medium text-slate-900"
          >
            Tema principal <span className="text-rose-600">*</span>
          </label>
          <input
            id="ai-topic"
            name="topic"
            type="text"
            value={values.topic}
            onChange={(event) => updateField("topic", event.target.value)}
            disabled={isBlocked}
            placeholder="Ej. Tendencias de diseño web para pequeñas empresas"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <p className="text-xs text-slate-500">
            Resume la idea central del post. Evita temas demasiado vagos.
          </p>
          {fieldErrors.topic ? (
            <p className="text-sm text-rose-600">{fieldErrors.topic}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="ai-context"
            className="block text-sm font-medium text-slate-900"
          >
            Contexto adicional
          </label>
          <textarea
            id="ai-context"
            name="context"
            rows={5}
            value={values.context}
            onChange={(event) => updateField("context", event.target.value)}
            disabled={isBlocked}
            placeholder="Agrega detalles, enfoque deseado, público objetivo o limitaciones."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {fieldErrors.context ? (
            <p className="text-sm text-rose-600">{fieldErrors.context}</p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="ai-tone"
              className="block text-sm font-medium text-slate-900"
            >
              Tono
            </label>
            <select
              id="ai-tone"
              name="tone"
              value={values.tone}
              onChange={(event) => updateField("tone", event.target.value)}
              disabled={isBlocked}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">Selecciona un tono</option>
              {TONE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors.tone ? (
              <p className="text-sm text-rose-600">{fieldErrors.tone}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="ai-category-name"
              className="block text-sm font-medium text-slate-900"
            >
              Categoría sugerida
            </label>
            <input
              id="ai-category-name"
              name="categoryName"
              type="text"
              value={values.categoryName}
              onChange={(event) => updateField("categoryName", event.target.value)}
              disabled={isBlocked}
              placeholder="Ej. Diseño web"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {fieldErrors.categoryName ? (
              <p className="text-sm text-rose-600">{fieldErrors.categoryName}</p>
            ) : null}
          </div>
        </div>

        {serverError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
            {lastModel ? (
              <span className="ml-1 text-emerald-800">Modelo: {lastModel}.</span>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <button
            type="submit"
            disabled={isBlocked}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Generando borrador..." : "Generar borrador"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isBlocked}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>
      </form>
    </section>
  );
}