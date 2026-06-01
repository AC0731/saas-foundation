"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "./auth";
import { db } from "./db";

type ActionResult = {
  success: boolean;
  message: string;
};

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getUserEmail() {
  const session = await getServerSession(authOptions);
  return session?.user?.email?.trim() || null;
}

export async function createNote(formData: FormData): Promise<ActionResult> {
  const email = await getUserEmail();

  if (!email) {
    return {
      success: false,
      message: "You must be signed in to save notes.",
    };
  }

  const title = getStringFormValue(formData, "title");
  const content = getStringFormValue(formData, "content");

  if (!title) {
    return {
      success: false,
      message: "Note title is required.",
    };
  }

  if (title.length > 120) {
    return {
      success: false,
      message: "Note title must be 120 characters or less.",
    };
  }

  if (content.length > 1000) {
    return {
      success: false,
      message: "Note content must be 1000 characters or less.",
    };
  }

  try {
    await db.note.create({
      data: {
        title,
        content: content || null,
        user: {
          connect: { email },
        },
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Note saved successfully.",
    };
  } catch (error) {
    console.error("Failed to create note:", error);

    return {
      success: false,
      message: "Failed to save note. Please try again.",
    };
  }
}

export async function deleteNote(formData: FormData): Promise<ActionResult> {
  const email = await getUserEmail();

  if (!email) {
    return {
      success: false,
      message: "You must be signed in to delete notes.",
    };
  }

  const noteId = getStringFormValue(formData, "noteId");

  if (!noteId) {
    return {
      success: false,
      message: "Missing note ID.",
    };
  }

  try {
    const result = await db.note.deleteMany({
      where: {
        id: noteId,
        user: {
          email,
        },
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        message: "Note not found or you do not have permission to delete it.",
      };
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Note deleted.",
    };
  } catch (error) {
    console.error("Failed to delete note:", error);

    return {
      success: false,
      message: "Failed to delete note. Please try again.",
    };
  }
}
