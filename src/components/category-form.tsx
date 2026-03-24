"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import FormMessage from "@/components/form-message";
import { validateCategoryInput } from "@/lib/category-validation";

type CategoryFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialData?: {
    name: string;
    slug: string;
  };
  errorMessage?: string;
  successMessage?: string;
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

function SubmitButton({
  isEditMode,
  hasChanges,
}: {
  isEditMode: boolean;
  hasChanges: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="actions">
      <button type="submit" disabled={pending || (isEditMode && !hasChanges)}>
        {pending
          ? "Guardando..."
          : isEditMode
            ? "Actualizar categoría"
            : "Crear categoría"}
      </button>
    </div>
  );
}

export default function CategoryForm({
  action,
  initialData,
  errorMessage,
  successMessage,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [showValidation, setShowValidation] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData?.slug));

  const isEditMode = Boolean(initialData);

  const initialName = initialData?.name ?? "";
  const initialSlug = initialData?.slug ?? "";

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const hasChanges = useMemo(() => {
    return name !== initialName || slug !== initialSlug;
  }, [name, slug, initialName, initialSlug]);

  const errors = useMemo(() => {
    return validateCategoryInput({
      name,
      slug: slug || undefined,
    });
  }, [name, slug]);

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
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={showValidation && Boolean(errors.name)}
        />
        {showValidation && errors.name ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.name}</p>
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
          placeholder="opcional-se-genera-desde-el-nombre"
          aria-invalid={showValidation && Boolean(errors.slug)}
        />
        {showValidation && errors.slug ? (
          <p style={{ color: "#b42318", margin: 0 }}>{errors.slug}</p>
        ) : (
          <p style={{ color: "#475467", margin: 0, fontSize: "14px" }}>
            Opcional. Si lo dejas vacío, se genera desde el nombre.
          </p>
        )}
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