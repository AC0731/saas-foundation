# INC-002 — Stripe webhook idempotency and ordering

**Status:** Resolved in this branch  
**Scope:** Subscription entitlement consistency

## Problem

While reviewing the billing flow, I found that the earlier webhook handler verified signatures but did not persist processed event IDs and applied subscription events directly as they arrived. Stripe webhooks can be delivered more than once and delivery order is not guaranteed.

That left two reliability gaps:

1. a repeated event could execute the same state transition again;
2. a late event from an older subscription could overwrite newer entitlement state.

## Invariants

The billing path now enforces these rules:

- A Stripe event ID is processed at most once.
- Event processing and the entitlement update are committed in one database transaction.
- Older events cannot overwrite a newer applied event for the same user.
- An event from an older Stripe subscription cannot replace a newer subscription generation.
- Deletion of an old subscription cannot clear a newer subscription.
- For subscription create/update events, the handler re-reads the current Subscription object from Stripe before applying state.
- A processing failure returns non-2xx so Stripe can retry.
- A duplicate delivery returns 2xx without mutating entitlement.

## Database changes

`StripeWebhookEvent.eventId` has a unique constraint and records the event type, Stripe creation time, related user/subscription, outcome, and processing time.

The User record also stores:

- `stripeSubscriptionCreated`
- `stripeLastEventCreated`
- `stripeLastEventId`

These values are used to reject stale or superseded updates.

## Recovery

```bash
npm run billing:reconcile -- --email user@example.com
```

The command is dry-run by default. It compares stored billing state with Stripe and prints drift.

To apply a repair:

```bash
npm run billing:reconcile -- --email user@example.com --apply
```

Applying reconciliation requires server-side database and Stripe credentials.

## Lifecycle verification matrix

| Scenario | Current verification |
|---|---|
| New active/trialing subscription | Policy/unit tests + webhook state path |
| Renewal/update | Current Stripe Subscription is re-read before apply |
| Failed payment / past_due | Entitlement helper treats non-active statuses as non-Pro |
| Cancel at period end | Active status remains entitled while cancellation flag is stored |
| Immediate cancellation | Deleted/canceled path clears current entitlement |
| Duplicate delivery | Database unique event ID + duplicate short-circuit |
| Older event delivered late | Event timestamp policy rejects stale event |
| Older subscription event delivered late | Subscription generation policy rejects superseded subscription |
| Processing interruption | DB event record and user mutation share one transaction; failure is retried |
| Data drift | Dry-run reconciliation command reports and can repair drift |

## Test boundary

Automated tests verify the ordering/entitlement/reconciliation policy. CI does not contain real Stripe credentials, so it does **not** claim to be an end-to-end Stripe test-mode delivery test. The webhook route still depends on Stripe's signed payload and API behavior in a configured environment.

That limit is documented so the automated policy tests are not confused with a live end-to-end payment integration test.
