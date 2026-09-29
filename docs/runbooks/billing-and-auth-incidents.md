# Runbook — Authentication and billing incidents

## Authentication failure

1. Confirm whether the failure is sign-in or account creation.
2. Check whether the email already exists and whether it is a credentials-capable account.
3. Do not attach a new password to an existing passwordless/provider-backed account as a shortcut.
4. Check rate-limit state and recent auth-related deployment changes.
5. Keep user-facing errors generic enough to avoid account enumeration.
6. Escalate with UTC timestamp, environment, affected flow, and safe request context.

## Stripe webhook degradation

1. Confirm application/database health.
2. Check whether Stripe signature verification is rejecting the request.
3. Record the webhook request reference and Stripe event ID from server logs.
4. Never bypass signature verification to restore service.
5. Confirm the webhook secret belongs to the current endpoint/environment.
6. Replay an event from Stripe only after the underlying issue is understood.
7. Validate the resulting user subscription state after replay.

## Subscription mismatch

If Checkout succeeded but workspace state is stale:

- confirm customer/subscription IDs belong to the authenticated user
- compare webhook delivery status and subscription status
- use the redirect-session synchronization only as a fallback
- do not set `isPro` directly from client-supplied data

## Evidence for escalation

Capture:

- UTC timestamp
- environment/deployment revision
- affected route or billing event type
- request reference / event ID
- database health
- rate-limit state where applicable
- actions already attempted
- expected vs observed subscription/auth state
