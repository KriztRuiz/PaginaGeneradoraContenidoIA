import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container narrow">
      <h1>Content MVP</h1>
      <p>Versión mínima para crear, editar, guardar borradores y publicar posts.</p>

      <div className="stack">
        <p>
          <Link href="/posts">Ver posts públicos</Link>
        </p>
        <p>
          <Link href="/admin/login">Entrar al admin</Link>
        </p>
      </div>
    </main>
  );
}