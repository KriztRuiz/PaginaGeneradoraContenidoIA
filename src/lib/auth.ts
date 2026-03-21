import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  return session;
}

export async function redirectIfAuthenticated(path = "/admin/posts") {
  const session = await auth();

  if (session?.user?.id) {
    redirect(path);
  }
}

export async function isSystemInitialized() {
  const usersCount = await prisma.user.count();
  return usersCount > 0;
}