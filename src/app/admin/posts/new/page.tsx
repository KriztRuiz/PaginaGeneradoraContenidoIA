import Link from "next/link";
import PostForm from "@/components/post-form";
import { createPostAction } from "@/actions/post-actions";
import { requireAdmin } from "@/lib/auth";

export default async function NewPostPage() {
  await requireAdmin();

  return (
    <main className="container">
      <h1>Nuevo post</h1>
      <PostForm action={createPostAction} />
      <p>
        <Link href="/admin/posts">Volver</Link>
      </p>
    </main>
  );
}