"use client";

import { useState } from "react";
import type { PostStatus } from "@prisma/client";

import { AIGeneratePostForm } from "@/components/ai-generate-post-form";
import PostForm from "@/components/post-form";
import type { AiPostFormSeed } from "@/lib/ai/ai-schemas";

type CategoryOption = {
  id: string;
  name: string;
};

type NewPostEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryOption[];
  errorMessage?: string;
};

export default function NewPostEditor({
  action,
  categories,
  errorMessage,
}: NewPostEditorProps) {
  const [aiSeed, setAiSeed] = useState<AiPostFormSeed | null>(null);

  return (
    <div className="stack">
      <AIGeneratePostForm onGenerated={setAiSeed} />

      {aiSeed ? (
        <div
          style={{
            border: "1px solid #b7ebc6",
            background: "#ecfdf3",
            color: "#067647",
            padding: "12px 14px",
            borderRadius: "10px",
          }}
        >
          Se generó un borrador y ya se cargó en el formulario inferior. Puedes
          editarlo antes de guardarlo.
        </div>
      ) : null}

      <PostForm
        action={action}
        categories={categories}
        errorMessage={errorMessage}
        aiSeed={aiSeed}
        initialData={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          seoTitle: "",
          seoDescription: "",
          scheduledAt: "",
          categoryId: "",
          status: "DRAFT" as PostStatus,
        }}
      />
    </div>
  );
}