-- Track Stripe webhook processing for idempotency and stale-event protection.
ALTER TABLE "User"
  ADD COLUMN "stripeLastEventCreated" INTEGER,
  ADD COLUMN "stripeLastEventId" TEXT;

CREATE TABLE "StripeWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "stripeCreated" INTEGER NOT NULL,
  "userId" TEXT,
  "subscriptionId" TEXT,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StripeWebhookEvent_eventId_key"
  ON "StripeWebhookEvent"("eventId");

CREATE INDEX "StripeWebhookEvent_userId_stripeCreated_idx"
  ON "StripeWebhookEvent"("userId", "stripeCreated");

CREATE INDEX "StripeWebhookEvent_subscriptionId_idx"
  ON "StripeWebhookEvent"("subscriptionId");

ALTER TABLE "StripeWebhookEvent"
  ADD CONSTRAINT "StripeWebhookEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
