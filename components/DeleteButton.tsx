"use client";

import { deleteNote } from "@/lib/actions";
import { FormEvent, useTransition } from "react";
import { toast } from "sonner";

export default function DeleteButton({ noteId }: { noteId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Delete this note? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await deleteNote(formData);

      if (result.success) {
        toast.info(result.message);
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="noteId" value={noteId} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
