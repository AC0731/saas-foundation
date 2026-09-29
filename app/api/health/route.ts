import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ready",
        checks: {
          database: "ok",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Readiness check failed:", error);

    return NextResponse.json(
      {
        status: "unavailable",
        checks: {
          database: "failed",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
