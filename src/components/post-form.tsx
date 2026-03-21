type PostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialData?: {
    title: string;
    slug: string;
    content: string;
    status: "DRAFT" | "PUBLISHED";
  };
};

export default function PostForm({ action, initialData }: PostFormProps) {
  const isPublished = initialData?.status === "PUBLISHED";

  return (
    <form action={action} className="stack">
      <div className="stack">
        <label htmlFor="title">Título</label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initialData?.title ?? ""}
          required
        />
      </div>

      <div className="stack">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={initialData?.slug ?? ""}
          placeholder="opcional-se-genera-desde-el-titulo"
        />
      </div>

      <div className="stack">
        <label htmlFor="content">Contenido</label>
        <textarea
          id="content"
          name="content"
          rows={16}
          defaultValue={initialData?.content ?? ""}
          required
        />
      </div>

      <div className="actions">
        <button type="submit" name="intent" value="save">
          Guardar borrador
        </button>

        <button type="submit" name="intent" value="publish">
          {isPublished ? "Actualizar y publicar" : "Publicar"}
        </button>
      </div>
    </form>
  );
}