"use server";

import { db } from "./db";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Save to Neon
  await db.note.create({
    data: {
      title,
      content,
      user: { connect: { email: session.user.email } }
    },
  });

  revalidatePath("/dashboard");
}