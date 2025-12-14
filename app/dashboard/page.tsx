import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { db } from "../../lib/db";
import { redirect } from "next/navigation";
import NoteForm from "@/components/NoteForm"; // Import new form
import DeleteButton from "@/components/DeleteButton"; // Import new button

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const notes = await db.note.findMany({
    where: { user: { email: session.user?.email! } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Workspace</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <section className="md:col-span-1">
          <NoteForm />
        </section>

        <section className="md:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-800">Your Library</h2>
          {notes.map((note) => (
            <div key={note.id} className="p-5 bg-white border rounded-xl shadow-sm flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{note.title}</h3>
                <p className="text-slate-600 text-sm mt-1">{note.content}</p>
              </div>
              <DeleteButton noteId={note.id} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}