"use client";

import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { deleteNote } from "@/lib/actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function DeleteButton({ noteId }: { noteId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.append("noteId", noteId);

    startTransition(async () => {
      const result = await deleteNote(formData);

      if (result.success) {
        toast.info(result.message);
        setIsDialogOpen(false);
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        disabled={isPending}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>

      <ConfirmDeleteDialog
        isOpen={isDialogOpen}
        isPending={isPending}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
