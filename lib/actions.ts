"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "./auth";
import { db } from "./db";

const FREE_NOTE_LIMIT = 3;

type ActionResult = {
  success: boolean;
  message: string;
};

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  return db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      isPro: true,
      _count: {
        select: {
          notes: true,
        },
      },
    },
  });
}

export async function createNote(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (!user) {
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

  if (!user.isPro && user._count.notes >= FREE_NOTE_LIMIT) {
    return {
      success: false,
      message: `Free workspaces are limited to ${FREE_NOTE_LIMIT} notes. Upgrade to Pro for unlimited notes.`,
    };
  }

  try {
    await db.note.create({
      data: {
        title,
        content: content || null,
        user: {
          connect: {
            id: user.id,
          },
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
  const user = await getCurrentUser();

  if (!user) {
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
        userId: user.id,
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
