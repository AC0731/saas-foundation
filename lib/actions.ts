"use server";

import { db } from "./db";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Save the note to Neon and link it to the user
  await db.note.create({
    data: {
      title,
      content,
      user: { connect: { email: session.user.email } }
    },
  });
  

  // This forces the dashboard to refresh and show the new note
  revalidatePath("/dashboard");
}

export async function deleteNote(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const noteId = formData.get("noteId") as string;

  // Security: Only delete the note if it belongs to the logged-in user
  await db.note.delete({
    where: {
      id: noteId,
      user: { email: session.user.email }
    },
  });

  revalidatePath("/dashboard");
}
