"use client";

import { useFormStatus } from "react-dom";
import { deletePostAction } from "@/actions/post-actions";

type ConfirmDeleteProps = {
  postId: string;
  title: string;
  buttonLabel?: string;
};

function DeleteButton({ buttonLabel }: { buttonLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Eliminando..." : buttonLabel}
    </button>
  );
}

export default function ConfirmDelete({
  postId,
  title,
  buttonLabel = "Eliminar",
}: ConfirmDeleteProps) {
  const boundDeleteAction = deletePostAction.bind(null, postId);

  return (
    <form
      action={boundDeleteAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Seguro que deseas eliminar "${title}"? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      style={{ display: "inline-block" }}
    >
      <DeleteButton buttonLabel={buttonLabel} />
    </form>
  );
}