import Link from "next/link";
import { createFirstAdminAction, loginAction } from "@/actions/auth-actions";
import { isSystemInitialized, redirectIfAuthenticated } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const initialized = await isSystemInitialized();

  if (initialized) {
    await redirectIfAuthenticated("/admin");
  }

  const params = await searchParams;

  const rawError = params.error;
  const rawSuccess = params.success;

  const error = Array.isArray(rawError) ? rawError[0] : rawError;
  const success = Array.isArray(rawSuccess) ? rawSuccess[0] : rawSuccess;

  if (!initialized) {
    return (
      <main className="container narrow">
        <h1>Configuración inicial</h1>
        <p>
          Aún no existe ningún usuario administrador. Crea el primero para
          inicializar el sistema.
        </p>

        <form action={createFirstAdminAction} className="stack card">
          <div className="stack">
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" type="text" required />
          </div>

          <div className="stack">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>

          <div className="stack">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required />
          </div>

          <div className="stack">
            <label htmlFor="confirmPassword">Confirmar password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
            />
          </div>

          <div className="stack">
            <label htmlFor="setupSecret">Setup secret</label>
            <input
              id="setupSecret"
              name="setupSecret"
              type="password"
              required
            />
          </div>

          {error ? <p className="error">{error}</p> : null}
          {success ? <p>{success}</p> : null}

          <button type="submit">Crear primer administrador</button>
        </form>

        <p>
          <Link href="/">Volver al inicio</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container narrow">
      <h1>Login admin</h1>

      <form action={loginAction} className="stack card">
        <div className="stack">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>

        <div className="stack">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>

        {error ? <p className="error">{error}</p> : null}
        {success ? <p>{success}</p> : null}

        <button type="submit">Entrar</button>
      </form>

      <p>
        <Link href="/">Volver al inicio</Link>
      </p>
    </main>
  );
}