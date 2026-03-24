"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import FormMessage from "@/components/form-message";
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
    categoryId?: string | null;
    status: "DRAFT" | "PUBLISHED";
  };
  errorMessage?: string;
  successMessage?: string;
};

type SubmitButtonsProps = {
  isEditMode: boolean;
  isPublished: boolean;
  hasChanges: boolean;
};

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

function SubmitButtons({
  isEditMode,
  isPublished,
  hasChanges,
}: SubmitButtonsProps) {
  const { pending } = useFormStatus();

  const saveDisabled =
    pending || (isEditMode && !isPublished && !hasChanges);

  const publishDisabled =
    pending || (isEditMode && isPublished && !hasChanges);

  const publishLabel = isEditMode
    ? isPublished
      ? "Actualizar"
      : "Publicar"
    : "Publicar";

  return (
    <div className="actions">
      <button type="submit" name="intent" value="save" disabled={saveDisabled}>
        {pending ? "Guardando..." : "Guardar borrador"}
      </button>

      <button
        type="submit"
        name="intent"
        value="publish"
        disabled={publishDisabled}
      >
        {pending ? "Guardando..." : publishLabel}
      </button>
    </div>
  );
}

export default function PostForm({
  action,
  categories = [],
  initialData,
  errorMessage,
  successMessage,
}: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [showValidation, setShowValidation] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData?.slug));

  const isEditMode = Boolean(initialData);
  const isPublished = initialData?.status === "PUBLISHED";

  const initialTitle = initialData?.title ?? "";
  const initialSlug = initialData?.slug ?? "";
  const initialExcerpt = initialData?.excerpt ?? "";
  const initialContent = initialData?.content ?? "";
  const initialCategoryId = initialData?.categoryId ?? "";

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const hasChanges = useMemo(() => {
    return (
      title !== initialTitle ||
      slug !== initialSlug ||
      excerpt !== initialExcerpt ||
      content !== initialContent ||
      categoryId !== initialCategoryId
    );
  }, [
    title,
    slug,
    excerpt,
    content,
    categoryId,
    initialTitle,
    initialSlug,
    initialExcerpt,
    initialContent,
    initialCategoryId,
  ]);

  const validationStatus: "DRAFT" | "PUBLISHED" =
    initialData?.status ?? "DRAFT";

  const errors = useMemo(() => {
    return validatePostInput({
      title,
      slug: slug || undefined,
      excerpt: excerpt || undefined,
      content,
      categoryId: categoryId || undefined,
      status: validationStatus,
    });
  }, [title, slug, excerpt, content, categoryId, validationStatus]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setShowValidation(true);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  }

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

      <SubmitButtons
        isEditMode={isEditMode}
        isPublished={isPublished}
        hasChanges={hasChanges}
      />
    </form>
  );
}