"use client";

import { useMemo, useState, useTransition } from "react";

import {
  generatePostDraftAction,
  type GeneratePostDraftActionResult,
} from "@/actions/ai-actions";
import type {
  AiPostFormSnapshot,
  AiRegenerableField,
} from "@/lib/ai/ai-schemas";

type GeneratePostFormValues = {
  topic: string;
  context: string;
  tone: string;
  categoryName: string;
};

type GeneratePostFormFieldErrors = Partial<
  Record<keyof GeneratePostFormValues | "targetFields", string>
>;

type SuccessfulGeneratePostDraftActionResult = Extract<
  GeneratePostDraftActionResult,
  { ok: true }
>;

type AIGeneratePostFormProps = {
  onGenerated: (result: SuccessfulGeneratePostDraftActionResult) => void;
  getCurrentDraft: () => AiPostFormSnapshot | null;
  hasDraftContent: boolean;
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
] as const;

const REGENERABLE_FIELD_OPTIONS: Array<{
  value: AiRegenerableField;
  label: string;
  description: string;
}> = [
  {
    value: "title",
    label: "Título",
    description: "Regenera solo el título principal.",
  },
  {
    value: "excerpt",
    label: "Extracto",
    description: "Regenera el resumen corto para listados.",
  },
  {
    value: "content",
    label: "Contenido",
    description: "Regenera solo el cuerpo del artículo.",
  },
  {
    value: "seoTitle",
    label: "SEO title",
    description: "Regenera el título SEO.",
  },
  {
    value: "seoDescription",
    label: "SEO description",
    description: "Regenera la meta descripción.",
  },
];

type UiStatus = "idle" | "generating" | "regenerating" | "success" | "error";

function trimOrEmpty(value: string) {
  return value.trim();
}

function validateBaseFields(
  values: GeneratePostFormValues,
): GeneratePostFormFieldErrors {
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
  return Object.values(errors).some(Boolean);
}

function mapServerFieldErrors(
  result: Extract<GeneratePostDraftActionResult, { ok: false }>,
): GeneratePostFormFieldErrors {
  return {
    topic: result.fieldErrors?.topic?.[0],
    context: result.fieldErrors?.context?.[0],
    tone: result.fieldErrors?.tone?.[0],
    categoryName: result.fieldErrors?.categoryName?.[0],
    targetFields: result.fieldErrors?.targetFields?.[0],
  };
}

function getStatusLabel(status: UiStatus) {
  switch (status) {
    case "idle":
      return "Listo";
    case "generating":
      return "Generando borrador";
    case "regenerating":
      return "Regenerando selección";
    case "success":
      return "Completado";
    case "error":
      return "Error";
    default:
      return "Listo";
  }
}

function getFieldLabel(field: AiRegenerableField) {
  switch (field) {
    case "title":
      return "título";
    case "excerpt":
      return "extracto";
    case "content":
      return "contenido";
    case "seoTitle":
      return "SEO title";
    case "seoDescription":
      return "SEO description";
    default:
      return field;
  }
}

function formatChangedFields(fields: AiRegenerableField[]) {
  const labels = fields.map(getFieldLabel);

  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;

  return `${labels.slice(0, -1).join(", ")} y ${labels.at(-1)}`;
}

function buildSuccessMessage(result: SuccessfulGeneratePostDraftActionResult) {
  if (result.mode === "full") {
    return "Se generó un borrador completo editable y se cargó en el formulario principal.";
  }

  return `Se regeneró ${formatChangedFields(result.changedFields)} y solo se actualizaron esos campos en el formulario.`;
}

export function AIGeneratePostForm({
  onGenerated,
  getCurrentDraft,
  hasDraftContent,
  disabled = false,
}: AIGeneratePostFormProps) {
  const [values, setValues] = useState<GeneratePostFormValues>(INITIAL_VALUES);
  const [targetFields, setTargetFields] = useState<AiRegenerableField[]>([]);
  const [status, setStatus] = useState<UiStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<GeneratePostFormFieldErrors>(
    {},
  );
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

  function toggleTargetField(field: AiRegenerableField) {
    if (isBlocked) {
      return;
    }

    setTargetFields((current) => {
      const next = current.includes(field)
        ? current.filter((value) => value !== field)
        : [...current, field];

      return next;
    });

    setFieldErrors((current) => {
      if (!current.targetFields) return current;
      return {
        ...current,
        targetFields: undefined,
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

  function resetMessages() {
    setServerError(null);
    setSuccessMessage(null);
  }

  function executeFullGeneration() {
    if (isBlocked) {
      return;
    }

    const clientErrors = validateBaseFields(values);
    setFieldErrors(clientErrors);
    resetMessages();

    if (hasErrors(clientErrors)) {
      setStatus("error");
      return;
    }

    setStatus("generating");

    startTransition(async () => {
      const result = await generatePostDraftAction({
        mode: "full",
        topic: values.topic,
        context: values.context,
        tone: values.tone,
        categoryName: values.categoryName,
      });

      if (!result.ok) {
        setFieldErrors(mapServerFieldErrors(result));
        setServerError(result.error);
        setStatus("error");
        return;
      }

      onGenerated(result);
      setFieldErrors({});
      setLastModel(result.meta.model);
      setSuccessMessage(buildSuccessMessage(result));
      setStatus("success");
    });
  }

  function executePartialRegeneration() {
    if (isBlocked) {
      return;
    }

    const clientErrors = validateBaseFields(values);

    if (targetFields.length === 0) {
      clientErrors.targetFields =
        "Selecciona al menos un campo para regenerar.";
    }

    if (!hasDraftContent) {
      clientErrors.targetFields =
        "Primero debes generar o escribir un borrador antes de usar la regeneración parcial.";
    }

    const currentDraft = getCurrentDraft();

    if (!currentDraft) {
      clientErrors.targetFields =
        "No hay un borrador disponible para usar como contexto.";
    }

    setFieldErrors(clientErrors);
    resetMessages();

    if (hasErrors(clientErrors)) {
      setStatus("error");
      return;
    }

    setStatus("regenerating");

    startTransition(async () => {
      const result = await generatePostDraftAction({
        mode: "partial",
        topic: values.topic,
        context: values.context,
        tone: values.tone,
        categoryName: values.categoryName,
        currentDraft: {
          title: currentDraft?.title ?? "",
          excerpt: currentDraft?.excerpt ?? "",
          content: currentDraft?.content ?? "",
          seoTitle: currentDraft?.seoTitle ?? "",
          seoDescription: currentDraft?.seoDescription ?? "",
        },
        targetFields,
      });

      if (!result.ok) {
        setFieldErrors(mapServerFieldErrors(result));
        setServerError(result.error);
        setStatus("error");
        return;
      }

      onGenerated(result);
      setFieldErrors({});
      setLastModel(result.meta.model);
      setSuccessMessage(buildSuccessMessage(result));
      setStatus("success");
    });
  }

  function handleReset() {
    if (isBlocked) {
      return;
    }

    setValues(INITIAL_VALUES);
    setTargetFields([]);
    setFieldErrors({});
    setServerError(null);
    setSuccessMessage(null);
    setStatus("idle");
    setLastModel(null);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Generar borrador con IA
          </h2>
          <p className="text-sm text-slate-600">
            La IA te ayuda a generar o mejorar partes del borrador, pero el
            resultado sigue siendo editable y no se publica automáticamente.
          </p>
        </div>

        <div className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
          Estado: {statusLabel}
        </div>
      </div>

      <div className="mt-6 space-y-5" aria-busy={isPending}>
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

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              Generación inicial
            </h3>
            <p className="text-sm text-slate-600">
              Crea un borrador completo para cargarlo en el formulario principal.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={executeFullGeneration}
              disabled={isBlocked}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && status === "generating"
                ? "Generando borrador..."
                : "Generar borrador completo"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              Regeneración parcial
            </h3>
            <p className="text-sm text-slate-600">
              Selecciona exactamente qué parte quieres mejorar. Solo esos campos
              se reemplazarán en el formulario.
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {REGENERABLE_FIELD_OPTIONS.map((option) => {
              const checked = targetFields.includes(option.value);

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    checked
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  } ${isBlocked || !hasDraftContent ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTargetField(option.value)}
                    disabled={isBlocked || !hasDraftContent}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-slate-900">
                      {option.label}
                    </span>
                    <span className="block text-xs text-slate-600">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {!hasDraftContent ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Primero genera un borrador completo o escribe contenido en el
              formulario antes de usar la regeneración parcial.
            </div>
          ) : null}

          {fieldErrors.targetFields ? (
            <p className="mt-3 text-sm text-rose-600">
              {fieldErrors.targetFields}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={executePartialRegeneration}
              disabled={isBlocked || !hasDraftContent}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && status === "regenerating"
                ? "Regenerando selección..."
                : "Regenerar selección"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isBlocked}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpiar controles
            </button>
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
      </div>
    </section>
  );
}