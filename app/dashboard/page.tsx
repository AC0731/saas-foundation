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
  <div className="min-h-screen bg-slate-50 p-10 font-sans text-slate-900">
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold text-indigo-600 mb-2">SaaS Dashboard</h1>
      <p className="text-emerald-600 font-medium mb-8 bg-emerald-50 px-3 py-1 rounded-full w-fit">
        ● Logged in as: {session.user?.email}
      </p>
      
      {/* Colorful Form Container */}
      <form action={createNote} className="flex flex-col gap-4 mb-10 p-8 border-none rounded-2xl bg-white shadow-xl shadow-indigo-100">
        <h2 className="font-bold text-xl text-slate-800">New Note</h2>
        <input 
          name="title" 
          placeholder="Title" 
          required 
          className="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
        />
        <textarea 
          name="content" 
          placeholder="What's on your mind?" 
          className="p-3 border border-slate-200 rounded-xl h-32 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
        />
        <button 
          type="submit" 
          className="bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
        >
          Save to Cloud
        </button>
      </form>

      {/* Colorful Notes List */}
      <div className="space-y-6">
        <h2 className="font-bold text-2xl text-slate-800 border-b border-slate-200 pb-2">Your Notes</h2>
        {notes.length === 0 ? (
          <div className="text-slate-400 text-center py-10 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200">
            No notes found yet. Start typing above!
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-6 border-l-4 border-indigo-500 rounded-r-xl bg-white shadow-md hover:shadow-indigo-100 transition-shadow">
              <h3 className="font-bold text-lg text-slate-900">{note.title}</h3>
              <p className="text-slate-600 mt-2 leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);
}