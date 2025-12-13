"use client";

import { toast } from "sonner";
import { deleteNote } from "@/lib/actions";

export default function DeleteButton({ noteId }: { noteId: string }) {
  return (
    <form action={async (formData) => {
      await deleteNote(formData);
      toast.info("Note deleted");
    }}>
      <input type="hidden" name="noteId" value={noteId} />
      <button type="submit" className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors">
        Delete
      </button>
    </form>
  );
}