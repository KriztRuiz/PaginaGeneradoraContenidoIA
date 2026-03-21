"use client";

import { FormEvent, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import FormMessage from "@/components/form-message";
import { validatePostInput } from "@/lib/post-validation";

type PostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialData?: {
    title: string;
    slug: string;
    content: string;
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
  initialData,
  errorMessage,
  successMessage,
}: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [showValidation, setShowValidation] = useState(false);

  const isEditMode = Boolean(initialData);
  const isPublished = initialData?.status === "PUBLISHED";

  const initialTitle = initialData?.title ?? "";
  const initialSlug = initialData?.slug ?? "";
  const initialContent = initialData?.content ?? "";

  const hasChanges = useMemo(() => {
    return (
      title !== initialTitle ||
      slug !== initialSlug ||
      content !== initialContent
    );
  }, [title, slug, content, initialTitle, initialSlug, initialContent]);

  const errors = useMemo(() => {
    return validatePostInput({ title, slug, content });
  }, [title, slug, content]);

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
          onChange={(event) => setSlug(event.target.value)}
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