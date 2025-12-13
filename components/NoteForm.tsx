"use client";

import { toast } from "sonner";
import { createNote } from "@/lib/actions";
import { useRef } from "react";

export default function NoteForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    try {
      await createNote(formData);
      formRef.current?.reset(); // Clear form after success
      toast.success("Note saved successfully!");
    } catch (error) {
      toast.error("Failed to save note.");
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col gap-3">
      <h2 className="font-bold text-slate-800">New Entry</h2>
      <input name="title" placeholder="Title" required className="p-2 border rounded-lg text-black text-sm" />
      <textarea name="content" placeholder="Content" className="p-2 border rounded-lg text-black text-sm h-24" />
      <button type="submit" className="bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-transform active:scale-95">
        Save Note
      </button>
    </form>
  );
}