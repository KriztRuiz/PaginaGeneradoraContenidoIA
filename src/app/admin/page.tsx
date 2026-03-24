import Link from "next/link";
import { logoutAction } from "@/actions/auth-actions";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="container">
      <div className="stack" style={{ gap: "24px" }}>
        <div className="toolbar">
          <div className="stack" style={{ gap: "8px" }}>
            <h1>Panel de administración</h1>
            <p style={{ margin: 0, color: "#475467" }}>
              Administra publicaciones y categorías desde un solo lugar.
            </p>
          </div>

          <div className="toolbar-actions">
            <form action={logoutAction}>
              <button type="submit">Salir</button>
            </form>
          </div>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <Link
            href="/admin/posts"
            className="card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="stack" style={{ gap: "8px" }}>
              <h2 style={{ margin: 0 }}>Posts</h2>
              <p style={{ margin: 0, color: "#475467" }}>
                Ver, editar y eliminar publicaciones.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/posts/new"
            className="card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="stack" style={{ gap: "8px" }}>
              <h2 style={{ margin: 0 }}>Nuevo post</h2>
              <p style={{ margin: 0, color: "#475467" }}>
                Crear una nueva publicación.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="stack" style={{ gap: "8px" }}>
              <h2 style={{ margin: 0 }}>Categorías</h2>
              <p style={{ margin: 0, color: "#475467" }}>
                Crear, editar y eliminar categorías.
              </p>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}