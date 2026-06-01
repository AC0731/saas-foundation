import DeleteButton from "@/components/DeleteButton";
import NoteForm from "@/components/NoteForm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim();

  if (!email) {
    redirect("/api/auth/signin");
  }

  const notes = await db.note.findMany({
    where: {
      user: { email },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-600">Protected Workspace</p>

        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Workspace Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage authenticated, database-backed workspace notes connected to your account.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Signed in as{" "}
            <span className="font-semibold text-slate-900">{email}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <section>
          <NoteForm />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Library</h2>
              <p className="mt-1 text-sm text-slate-500">
                {notes.length === 1
                  ? "1 saved workspace note"
                  : `${notes.length} saved workspace notes`}
              </p>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-base font-semibold text-slate-900">
                No notes saved yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create your first note to test the authenticated database workflow.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-950">{note.title}</h3>

                    {note.content ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {note.content}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm italic text-slate-400">
                        No additional content.
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                      Created {note.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  <DeleteButton noteId={note.id} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}