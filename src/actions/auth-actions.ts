"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSystemInitialized } from "@/lib/auth";

function buildLoginUrl(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/login?${query}` : "/admin/login";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createFirstAdminAction(formData: FormData) {
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");
  const setupSecret = getString(formData, "setupSecret");

  const initialized = await isSystemInitialized();

  if (initialized) {
    redirect(buildLoginUrl({ error: "El sistema ya fue inicializado." }));
  }

  const expectedSetupSecret = process.env.SETUP_SECRET?.trim();

  if (!expectedSetupSecret) {
    redirect(
      buildLoginUrl({
        error: "SETUP_SECRET no está configurado en el entorno.",
      })
    );
  }

  if (!name || !email || !password || !confirmPassword || !setupSecret) {
    redirect(
      buildLoginUrl({
        error: "Completa todos los campos de configuración inicial.",
      })
    );
  }

  if (!isValidEmail(email)) {
    redirect(
      buildLoginUrl({
        error: "Ingresa un email válido.",
      })
    );
  }

  if (password.length < 8) {
    redirect(
      buildLoginUrl({
        error: "La contraseña debe tener al menos 8 caracteres.",
      })
    );
  }

  if (password !== confirmPassword) {
    redirect(
      buildLoginUrl({
        error: "Las contraseñas no coinciden.",
      })
    );
  }

  if (setupSecret !== expectedSetupSecret) {
    redirect(
      buildLoginUrl({
        error: "Setup secret inválido.",
      })
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    redirect(
      buildLoginUrl({
        error: "Ese email ya está en uso.",
      })
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  redirect(
    buildLoginUrl({
      success: "Administrador creado correctamente. Ahora inicia sesión.",
    })
  );
}

function loginErrorUrl(message: string) {
  return buildLoginUrl({ error: message });
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const safeEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const safePassword = typeof password === "string" ? password : "";

  if (!safeEmail || !safePassword) {
    redirect(loginErrorUrl("Completa email y password."));
  }

  try {
    await signIn("credentials", {
      email: safeEmail,
      password: safePassword,
      redirectTo: "/admin/posts",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(loginErrorUrl("Credenciales inválidas."));
    }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({
    redirectTo: "/admin/login",
  });
}