import pg from "pg";

const { Client } = pg;

const isVercelProduction =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production";

if (!isVercelProduction) {
  console.log(
    "Production schema bridge skipped: this is not a Vercel production build."
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "Production schema bridge refused to run: DATABASE_URL is missing."
  );
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();
  await client.query("BEGIN");

  console.log(
    "Applying additive billing schema bridge. This script does not drop columns, tables, constraints, or data."
  );

  await client.query(`
    ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "stripeSubscriptionCreated" INTEGER,
      ADD COLUMN IF NOT EXISTS "stripeLastEventCreated" INTEGER,
      ADD COLUMN IF NOT EXISTS "stripeLastEventId" TEXT;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
      "id" TEXT NOT NULL,
      "eventId" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "stripeCreated" INTEGER NOT NULL,
      "userId" TEXT,
      "subscriptionId" TEXT,
      "outcome" TEXT NOT NULL DEFAULT 'processed',
      "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
    );
  `);

  await client.query(`
    ALTER TABLE "StripeWebhookEvent"
      ADD COLUMN IF NOT EXISTS "eventId" TEXT,
      ADD COLUMN IF NOT EXISTS "eventType" TEXT,
      ADD COLUMN IF NOT EXISTS "stripeCreated" INTEGER,
      ADD COLUMN IF NOT EXISTS "userId" TEXT,
      ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT,
      ADD COLUMN IF NOT EXISTS "outcome" TEXT DEFAULT 'processed',
      ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
  `);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "StripeWebhookEvent_eventId_key"
      ON "StripeWebhookEvent"("eventId");
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_userId_stripeCreated_idx"
      ON "StripeWebhookEvent"("userId", "stripeCreated");
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_subscriptionId_idx"
      ON "StripeWebhookEvent"("subscriptionId");
  `);

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'StripeWebhookEvent_userId_fkey'
      ) THEN
        ALTER TABLE "StripeWebhookEvent"
          ADD CONSTRAINT "StripeWebhookEvent_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END
    $$;
  `);

  await client.query(`
    SELECT
      "stripeSubscriptionCreated",
      "stripeLastEventCreated",
      "stripeLastEventId"
    FROM "User"
    LIMIT 1;
  `);

  await client.query(`SELECT COUNT(*) FROM "StripeWebhookEvent";`);

  await client.query("COMMIT");
  console.log("Additive billing schema bridge completed and verified successfully.");
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Ignore rollback errors; the original failure is more useful.
  }

  console.error(
    "Additive billing schema bridge failed:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
