"use client";

import { createNote } from "@/lib/actions";
import { FormEvent, useRef, useTransition } from "react";
import { toast } from "sonner";

export default function NoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createNote(formData);

      if (result.success) {
        formRef.current?.reset();
        toast.success(result.message);
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">New Entry</h2>
        <p className="mt-1 text-sm text-slate-500">
          Capture a workspace note linked to your authenticated account.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Title
        <input
          name="title"
          placeholder="Project update"
          required
          maxLength={120}
          disabled={isPending}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Content
        <textarea
          name="content"
          placeholder="Add details, decisions, or next steps..."
          maxLength={1000}
          disabled={isPending}
          className="h-28 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "Saving..." : "Save Note"}
      </button>
    </form>
  );
}
