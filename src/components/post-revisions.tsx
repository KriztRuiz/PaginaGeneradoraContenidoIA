import type { PostStatus, Prisma } from "@prisma/client";

type RevisionItem = {
  id: string;
  action: string;
  editorId: string | null;
  createdAt: Date;
  snapshotJson: Prisma.JsonValue;
};

type PostRevisionsProps = {
  revisions: RevisionItem[];
};

type SnapshotRecord = {
  title?: string;
  slug?: string;
  status?: PostStatus | string;
  excerpt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  categoryId?: string | null;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatAction(action: string) {
  switch (action) {
    case "CREATED":
      return "Creado";
    case "UPDATED":
      return "Actualizado";
    case "STATUS_CHANGED":
      return "Cambio de estado";
    case "SCHEDULED":
      return "Programado";
    case "PUBLISHED":
      return "Publicado";
    case "REJECTED":
      return "Rechazado";
    case "AUTO_PUBLISHED":
      return "Publicado automáticamente";
    default:
      return action;
  }
}

function formatStatus(status?: string) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "PENDING":
      return "Pendiente";
    case "SCHEDULED":
      return "Programado";
    case "PUBLISHED":
      return "Publicado";
    case "REJECTED":
      return "Rechazado";
    default:
      return status ?? "—";
  }
}

function isSnapshotRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getSnapshot(snapshotJson: Prisma.JsonValue): SnapshotRecord | null {
  if (!isSnapshotRecord(snapshotJson)) {
    return null;
  }

  return {
    title:
      typeof snapshotJson.title === "string" ? snapshotJson.title : undefined,
    slug: typeof snapshotJson.slug === "string" ? snapshotJson.slug : undefined,
    status:
      typeof snapshotJson.status === "string"
        ? snapshotJson.status
        : undefined,
    excerpt:
      typeof snapshotJson.excerpt === "string" || snapshotJson.excerpt === null
        ? (snapshotJson.excerpt as string | null)
        : undefined,
    seoTitle:
      typeof snapshotJson.seoTitle === "string" ||
      snapshotJson.seoTitle === null
        ? (snapshotJson.seoTitle as string | null)
        : undefined,
    seoDescription:
      typeof snapshotJson.seoDescription === "string" ||
      snapshotJson.seoDescription === null
        ? (snapshotJson.seoDescription as string | null)
        : undefined,
    scheduledAt:
      typeof snapshotJson.scheduledAt === "string" ||
      snapshotJson.scheduledAt === null
        ? (snapshotJson.scheduledAt as string | null)
        : undefined,
    publishedAt:
      typeof snapshotJson.publishedAt === "string" ||
      snapshotJson.publishedAt === null
        ? (snapshotJson.publishedAt as string | null)
        : undefined,
    categoryId:
      typeof snapshotJson.categoryId === "string" ||
      snapshotJson.categoryId === null
        ? (snapshotJson.categoryId as string | null)
        : undefined,
  };
}

function formatOptionalIsoDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDate(parsed);
}

export default function PostRevisions({ revisions }: PostRevisionsProps) {
  return (
    <section className="stack" style={{ marginTop: "24px" }}>
      <h2>Historial de revisiones</h2>

      {revisions.length === 0 ? (
        <p style={{ margin: 0, color: "#475467" }}>
          Este post todavía no tiene revisiones registradas.
        </p>
      ) : (
        <div className="stack">
          {revisions.map((revision) => {
            const snapshot = getSnapshot(revision.snapshotJson);

            return (
              <article
                key={revision.id}
                className="card"
                style={{
                  border: "1px solid #d0d5dd",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <strong>{formatAction(revision.action)}</strong>
                  <span style={{ color: "#475467", fontSize: "14px" }}>
                    {formatDate(revision.createdAt)}
                  </span>
                </div>

                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Editor:</strong> {revision.editorId ?? "Sistema"}
                </p>

                {snapshot ? (
                  <div className="stack" style={{ gap: "6px" }}>
                    <p style={{ margin: 0 }}>
                      <strong>Título:</strong> {snapshot.title ?? "—"}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>Slug:</strong> {snapshot.slug ?? "—"}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>Estado:</strong> {formatStatus(snapshot.status)}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>Extracto:</strong> {snapshot.excerpt ?? "—"}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>SEO title:</strong> {snapshot.seoTitle ?? "—"}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>SEO description:</strong>{" "}
                      {snapshot.seoDescription ?? "—"}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>Programado:</strong>{" "}
                      {formatOptionalIsoDate(snapshot.scheduledAt)}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>Publicado:</strong>{" "}
                      {formatOptionalIsoDate(snapshot.publishedAt)}
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#475467" }}>
                    No se pudo interpretar el snapshot de esta revisión.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}