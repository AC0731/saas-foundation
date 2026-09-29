# Runbook — Subscription state mismatch

## Symptom

A user reports Pro access that does not match Stripe, or a webhook retry/outage leaves the database state uncertain.

## First checks

1. Confirm `GET /api/health` reports database readiness.
2. Identify the user by authenticated email/account ID.
3. Check the stored Stripe customer/subscription IDs.
4. Review recent `StripeWebhookEvent` rows and outcomes.
5. Compare the latest stored event timestamp with the Stripe event history.

## Dry-run reconciliation

```bash
npm run billing:reconcile -- --email user@example.com
```

Do not use `--apply` until the drift output is understood.

## Apply repair

```bash
npm run billing:reconcile -- --email user@example.com --apply
```

The command updates entitlement from current Stripe state and advances the local event watermark so an older queued event cannot immediately regress the repair.

## Duplicate event

If an event ID is already present, treat a repeated delivery as expected Stripe behavior. Do not delete the event record to make the webhook run again.

## Out-of-order event

A stale event should be recorded with a non-applied outcome. If the stored entitlement is still wrong, reconcile against current Stripe state rather than replaying old events manually.

## Escalation evidence

Capture:

- user ID/email (redacted if shared)
- Stripe customer and subscription IDs
- webhook event ID/type
- event outcome
- current stored entitlement
- dry-run reconciliation diff
- deployment revision
- UTC timestamps

Never paste Stripe secrets, webhook signing secrets, session cookies, or password hashes into an incident ticket.
