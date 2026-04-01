"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { PostStatus } from "@prisma/client";

import { AIGeneratePostForm } from "@/components/ai-generate-post-form";
import PostForm from "@/components/post-form";
import { hasAnyDraftContent } from "@/lib/ai/ai-mappers";
import type {
  AiPostFormPatch,
  AiPostFormSeed,
  AiPostFormSnapshot,
  AiRegenerableField,
} from "@/lib/ai/ai-schemas";
import type { GeneratePostDraftActionResult } from "@/actions/ai-actions";

type CategoryOption = {
  id: string;
  name: string;
};

type NewPostEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryOption[];
  errorMessage?: string;
};

type SuccessfulGeneratePostDraftActionResult = Extract<
  GeneratePostDraftActionResult,
  { ok: true }
>;

type AiEditorCommand = {
  id: number;
  mode: "full" | "partial";
  data: AiPostFormSeed | AiPostFormPatch;
  changedFields: AiRegenerableField[];
};

function getFieldLabel(field: AiRegenerableField) {
  switch (field) {
    case "title":
      return "título";
    case "excerpt":
      return "extracto";
    case "content":
      return "contenido";
    case "seoTitle":
      return "SEO title";
    case "seoDescription":
      return "SEO description";
    default:
      return field;
  }
}

function formatChangedFields(fields: AiRegenerableField[]) {
  const labels = fields.map(getFieldLabel);

  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;

  return `${labels.slice(0, -1).join(", ")} y ${labels.at(-1)}`;
}

function buildAiFeedbackMessage(result: SuccessfulGeneratePostDraftActionResult) {
  if (result.mode === "full") {
    return "Se generó un borrador completo y ya se cargó en el formulario inferior. Puedes editarlo antes de guardarlo.";
  }

  return `Se regeneró ${formatChangedFields(result.changedFields)}. El resto del borrador se conservó intacto.`;
}

export default function NewPostEditor({
  action,
  categories,
  errorMessage,
}: NewPostEditorProps) {
  const commandIdRef = useRef(0);

  const [draftSnapshot, setDraftSnapshot] = useState<AiPostFormSnapshot | null>(
    null,
  );
  const [aiCommand, setAiCommand] = useState<AiEditorCommand | null>(null);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);

  const hasDraftContent = useMemo(
    () => hasAnyDraftContent(draftSnapshot),
    [draftSnapshot],
  );

  const getCurrentDraft = useCallback(() => draftSnapshot, [draftSnapshot]);

  const handleGenerated = useCallback(
    (result: SuccessfulGeneratePostDraftActionResult) => {
      commandIdRef.current += 1;

      setAiCommand({
        id: commandIdRef.current,
        mode: result.mode,
        data: result.data,
        changedFields: result.changedFields,
      });

      setAiFeedbackMessage(buildAiFeedbackMessage(result));
    },
    [],
  );

  return (
    <div className="stack">
      <AIGeneratePostForm
        onGenerated={handleGenerated}
        getCurrentDraft={getCurrentDraft}
        hasDraftContent={hasDraftContent}
      />

      {aiFeedbackMessage ? (
        <div
          style={{
            border: "1px solid #b7ebc6",
            background: "#ecfdf3",
            color: "#067647",
            padding: "12px 14px",
            borderRadius: "10px",
          }}
        >
          {aiFeedbackMessage}
        </div>
      ) : null}

      <PostForm
        action={action}
        categories={categories}
        errorMessage={errorMessage}
        aiCommand={aiCommand}
        onSnapshotChange={setDraftSnapshot}
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