import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { db } from "../../lib/db";
import { redirect } from "next/navigation";
import { createNote } from "../../lib/actions";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin?callbackUrl=/dashboard");


  const notes = await db.note.findMany({
    where: { user: { email: session.user?.email! } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto p-10 font-sans">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-green-600 mb-8">Logged in as: {session.user?.email}</p>
      
      <form action={createNote} className="flex flex-col gap-4">
        <h2 className="font-bold text-lg">New Note</h2>
        <input name="title" placeholder="Title" required className="p-2 border rounded text-black" />
        <textarea name="content" placeholder="Content" className="p-2 border rounded text-black h-24" />
        <button type="submit" className="bg-black text-white p-2 rounded hover:bg-gray-800">Save Note</button>
      </form>

      <div className="space-y-4">
        <h2 className="font-bold text-lg">Your Notes</h2>
        {notes.map((note) => (
          <div key={note.id} className="p-4 border rounded bg-gray-50">
            <h3 className="font-bold">{note.title}</h3>
            <p className="text-gray-600 text-sm">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}