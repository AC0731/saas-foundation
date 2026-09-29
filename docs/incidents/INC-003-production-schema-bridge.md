# INC-003 — Production billing schema recovery

**Status:** Resolved  
**Date:** 2026-09-29  
**Scope:** Production database schema / billing readiness

## Detection

After the billing reliability changes were deployed, the application code was current but the production PostgreSQL schema was not.

The readiness endpoint reported:

```json
{
  "status": "unavailable",
  "checks": {
    "database": "ok",
    "billingSchema": "failed"
  }
}
```

This separated a healthy database connection from an incompatible application schema.

## Initial release attempt

The first recovery PR added a production-only bridge using Prisma schema sync.

Safety controls were:

- run only when `VERCEL=1` and `VERCEL_ENV=production`;
- skip preview, local and GitHub CI builds;
- no `--accept-data-loss`;
- fail the deployment instead of forcing a destructive change.

The Vercel production build exited non-zero. The previous production deployment stayed active.

The available deployment metadata confirmed the failed build but the connected Vercel authorization did not expose team-scoped build logs, so this incident does **not** claim a specific Prisma root cause that was not verified.

## Revised decision

Instead of retrying a broad schema synchronization, the recovery was narrowed to the exact additive structures required by the billing reliability release.

The replacement bridge:

- added `stripeSubscriptionCreated`, `stripeLastEventCreated`, and `stripeLastEventId` to `User` if missing;
- created `StripeWebhookEvent` if missing;
- created the unique event ID and lookup indexes;
- added the optional user foreign key if missing;
- executed inside one PostgreSQL transaction;
- queried the new columns/table before committing;
- contained no DROP statements or data-removal operations.

If any step failed, the transaction rolled back and the deployment failed closed.

## Verification

The replacement production deployment reached `READY`.

The live readiness response then became:

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "billingSchema": "ok"
  }
}
```

The temporary build hook was removed immediately afterward so ordinary application builds no longer perform schema changes.

## What this proves

- the deployed app can connect to its database;
- the billing reliability columns/table required by the current runtime are present;
- the release path failed safely when the first bridge did not complete;
- the successful bridge was additive and transactional.

## What this does not prove

- that the legacy database has a fully baselined Prisma migration history;
- that every future migration can be applied automatically;
- that Stripe test-mode webhook delivery has been exercised end-to-end by CI.

Those remain separate operational concerns and are documented in the deployment guide.

## Lesson

Readiness should verify the dependency contract the application actually needs, not only network connectivity. A database returning `SELECT 1` can still be unready for the deployed application when schema state is behind the code.
