"use client";

import type { PostStatus } from "@prisma/client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import FormMessage from "@/components/form-message";
import type { AiPostFormSeed } from "@/lib/ai/ai-schemas";
import { validatePostInput } from "@/lib/post-validation";

type CategoryOption = {
  id: string;
  name: string;
};

type PostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories?: CategoryOption[];
  initialData?: {
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    scheduledAt?: string | null;
    categoryId?: string | null;
    status: PostStatus;
  };
  aiSeed?: AiPostFormSeed | null;
  errorMessage?: string;
  successMessage?: string;
};

type SubmitButtonProps = {
  isEditMode: boolean;
  hasChanges: boolean;
};

const STATUS_OPTIONS: Array<{ value: PostStatus; label: string }> = [
  { value: "DRAFT", label: "Borrador" },
  { value: "PENDING", label: "Pendiente" },
  { value: "SCHEDULED", label: "Programado" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "REJECTED", label: "Rechazado" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCategoryIdByName(
  categories: CategoryOption[],
  categoryName?: string,
) {
  if (!categoryName) return "";

  const normalizedTarget = normalizeText(categoryName);

  const exactMatch = categories.find(
    (category) => normalizeText(category.name) === normalizedTarget,
  );

  if (exactMatch) {
    return exactMatch.id;
  }

  const includesMatch = categories.find((category) =>
    normalizeText(category.name).includes(normalizedTarget),
  );

  if (includesMatch) {
    return includesMatch.id;
  }

  return "";
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function hasValidationErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

function SubmitButton({ isEditMode, hasChanges }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <div className="actions">
      <button type="submit" disabled={pending || (isEditMode && !hasChanges)}>
        {pending
          ? "Guardando..."
          : isEditMode
            ? "Actualizar"
            : "Crear post"}
      </button>
    </div>
  );
}

export default function PostForm({
  action,
  categories = [],
  initialData,
  aiSeed,
  errorMessage,
  successMessage,
}: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seoDescription ?? "",
  );
  const [scheduledAt, setScheduledAt] = useState(
    toDateTimeLocalValue(initialData?.scheduledAt),
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [status, setStatus] = useState<PostStatus>(
    initialData?.status ?? "DRAFT",
  );
  const [showValidation, setShowValidation] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData?.slug));

  const isEditMode = Boolean(initialData?.title || initialData?.content);

  const initialTitle = initialData?.title ?? "";
  const initialSlug = initialData?.slug ?? "";
  const initialExcerpt = initialData?.excerpt ?? "";
  const initialContent = initialData?.content ?? "";
  const initialSeoTitle = initialData?.seoTitle ?? "";
  const initialSeoDescription = initialData?.seoDescription ?? "";
  const initialScheduledAt = toDateTimeLocalValue(initialData?.scheduledAt);
  const initialCategoryId = initialData?.categoryId ?? "";
  const initialStatus = initialData?.status ?? "DRAFT";

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  useEffect(() => {
    if (isEditMode || !aiSeed) {
      return;
    }

    setTitle(aiSeed.title);
    setSlug(slugify(aiSeed.title));
    setSlugTouched(false);
    setExcerpt(aiSeed.excerpt);
    setContent(aiSeed.content);
    setSeoTitle(aiSeed.seoTitle);
    setSeoDescription(aiSeed.seoDescription);
    setCategoryId(findCategoryIdByName(categories, aiSeed.categoryName));
    setScheduledAt("");
    setStatus("DRAFT");
    setShowValidation(false);
  }, [aiSeed, categories, isEditMode]);

  const hasChanges = useMemo(() => {
    return (
      title !== initialTitle ||
      slug !== initialSlug ||
      excerpt !== initialExcerpt ||
      content !== initialContent ||
      seoTitle !== initialSeoTitle ||
      seoDescription !== initialSeoDescription ||
      scheduledAt !== initialScheduledAt ||
      categoryId !== initialCategoryId ||
      status !== initialStatus
    );
  }, [
    title,
    slug,
    excerpt,
    content,
    seoTitle,
    seoDescription,
    scheduledAt,
    categoryId,
    status,
    initialTitle,
    initialSlug,
    initialExcerpt,
    initialContent,
    initialSeoTitle,
    initialSeoDescription,
    initialScheduledAt,
    initialCategoryId,
    initialStatus,
  ]);

  const errors = useMemo(() => {
    return validatePostInput({
      title,
      slug: slug || undefined,
      excerpt: excerpt || undefined,
      content,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      scheduledAt: scheduledAt || undefined,
      categoryId: categoryId || undefined,
      status,
    });
  }, [
    title,
    slug,
    excerpt,
    content,
    seoTitle,
    seoDescription,
    scheduledAt,
    categoryId,
    status,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setShowValidation(true);

    if (hasValidationErrors(errors)) {
      event.preventDefault();
    }
  }

  const showScheduledAtField = status === "SCHEDULED";

  return (
    <form action={action} onSubmit={handleSubmit} className="stack" noValidate>
      {successMessage ? (
        <FormMessage type="success" message={successMessage} />
      ) : null}

      {errorMessage ? <FormMessage type="error" message={errorMessage} /> : null}

      <div className="stack">
        <label htmlFor="title">Título</label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={showValidation && Boolean(errors.title)}
        />
        {showValidation && errors.title ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.title}</p>
        ) : null}
      </div>

      <div className="stack">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          type="text"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          placeholder="opcional-se-genera-desde-el-titulo"
          aria-invalid={showValidation && Boolean(errors.slug)}
        />
        {showValidation && errors.slug ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.slug}</p>
        ) : (
          <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
            Opcional. Si lo dejas vacío, se genera desde el título.
          </p>
        )}
      </div>

      <div className="stack">
        <label htmlFor="excerpt">Extracto</label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={3}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="Resumen corto opcional para listados"
          aria-invalid={showValidation && Boolean(errors.excerpt)}
        />
        {showValidation && errors.excerpt ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.excerpt}</p>
        ) : (
          <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
            Opcional. Máximo 320 caracteres.
          </p>
        )}
      </div>

      <div className="stack">
        <label htmlFor="categoryId">Categoría</label>
        <select
          id="categoryId"
          name="categoryId"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          aria-invalid={showValidation && Boolean(errors.categoryId)}
        >
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {showValidation && errors.categoryId ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="stack">
        <label htmlFor="status">Estado</label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as PostStatus)}
          aria-invalid={showValidation && Boolean(errors.status)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {showValidation && errors.status ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.status}</p>
        ) : (
          <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
            El estado ahora se controla directamente desde el formulario.
          </p>
        )}
      </div>

      {showScheduledAtField ? (
        <div className="stack">
          <label htmlFor="scheduledAt">Fecha programada</label>
          <input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            aria-invalid={showValidation && Boolean(errors.scheduledAt)}
          />
          {showValidation && errors.scheduledAt ? (
            <p style={{ color: "#b42318", margin: 0 }}>{errors.scheduledAt}</p>
          ) : (
            <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
              Obligatoria cuando el estado es Programado.
            </p>
          )}
        </div>
      ) : null}

      <div className="stack">
        <label htmlFor="seoTitle">SEO title</label>
        <input
          id="seoTitle"
          name="seoTitle"
          type="text"
          value={seoTitle}
          onChange={(event) => setSeoTitle(event.target.value)}
          maxLength={70}
          aria-invalid={showValidation && Boolean(errors.seoTitle)}
        />
        {showValidation && errors.seoTitle ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.seoTitle}</p>
        ) : (
          <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
            Opcional. Máximo 70 caracteres.
          </p>
        )}
      </div>

      <div className="stack">
        <label htmlFor="seoDescription">SEO description</label>
        <textarea
          id="seoDescription"
          name="seoDescription"
          rows={3}
          value={seoDescription}
          onChange={(event) => setSeoDescription(event.target.value)}
          maxLength={160}
          aria-invalid={showValidation && Boolean(errors.seoDescription)}
        />
        {showValidation && errors.seoDescription ? (
          <p style={{ color: "#b42318", margin: 0 }}>
            {errors.seoDescription}
          </p>
        ) : (
          <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
            Opcional. Máximo 160 caracteres.
          </p>
        )}
      </div>

      <div className="stack">
        <label htmlFor="content">Contenido</label>
        <textarea
          id="content"
          name="content"
          rows={16}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          aria-invalid={showValidation && Boolean(errors.content)}
        />
        {showValidation && errors.content ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.content}</p>
        ) : null}
      </div>

      {isEditMode && !hasChanges ? (
        <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
          No hay cambios por guardar.
        </p>
      ) : null}

      <SubmitButton isEditMode={isEditMode} hasChanges={hasChanges} />
    </form>
  );
}