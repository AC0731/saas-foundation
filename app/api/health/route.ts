import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Database readiness check failed:", error);

    return NextResponse.json(
      {
        status: "unavailable",
        checks: {
          database: "failed",
          billingSchema: "unknown",
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

  try {
    await Promise.all([
      db.stripeWebhookEvent.count(),
      db.user.findFirst({
        select: {
          stripeSubscriptionCreated: true,
          stripeLastEventCreated: true,
          stripeLastEventId: true,
        },
      }),
    ]);
  } catch (error) {
    console.error("Billing schema readiness check failed:", error);

    return NextResponse.json(
      {
        status: "unavailable",
        checks: {
          database: "ok",
          billingSchema: "failed",
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

  return NextResponse.json(
    {
      status: "ready",
      checks: {
        database: "ok",
        billingSchema: "ok",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
