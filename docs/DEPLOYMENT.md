# Deployment Guide

This document explains the production deployment setup for SaaS Foundation.

## Deployment Target

Recommended platform:

- Vercel for Next.js hosting
- Neon or another managed PostgreSQL provider for the database
- Stripe for billing, checkout, customer portal, and webhooks
- GitHub Actions for CI checks before merging changes

## Production Environment Checklist

Set these environment variables in the deployment platform:

- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID

Do not commit real secrets to GitHub.

## Vercel Setup

1. Import the GitHub repository into Vercel.
2. Set the framework preset to Next.js.
3. Add all required environment variables.
4. Set NEXTAUTH_URL to the deployed production URL.
5. Deploy from the master branch.
6. Confirm the landing page, auth page, dashboard, and Stripe webhook route build successfully.

## Database Release Procedure

This project uses Prisma with PostgreSQL. Development historically used `prisma db push`, while new schema changes are versioned in `prisma/migrations`.

Do **not** run migrations automatically from every preview build.

### Completed legacy production bridge

The billing reliability schema bridge was completed on September 29, 2026.

Release sequence:

1. The first production-only bridge used a broad Prisma schema sync. The Vercel production build exited non-zero, and the previous production deployment remained active.
2. The approach was narrowed to explicit additive PostgreSQL DDL for only the required billing columns/table/indexes.
3. The replacement ran in one transaction and verified the new objects before commit.
4. The replacement Vercel deployment reached `READY`.
5. The live readiness endpoint changed from:

       {"status":"unavailable","checks":{"database":"ok","billingSchema":"failed"}}

   to:

       {"status":"ready","checks":{"database":"ok","billingSchema":"ok"}}

6. The temporary build hook was then removed so normal application builds no longer mutate the production schema.

The guarded bridge script is retained as incident evidence, but it is no longer invoked by `npm run build`.

See `docs/incidents/INC-003-production-schema-bridge.md`.

### Existing legacy database

Before the first migration-based production release:

1. Take a database snapshot/backup.
2. Run `npx prisma migrate status`.
3. Compare the live schema with the repository schema before baselining:

       npx prisma migrate diff \
         --from-url "$DATABASE_URL" \
         --to-schema prisma/schema.prisma \
         --script

4. If the live database already contains the structures represented by the historical migrations, mark only those historical migrations as applied with `prisma migrate resolve --applied <migration-name>`.
5. Run `npx prisma migrate deploy` to apply migrations that are genuinely missing.
6. Verify `/api/health` reports both `database: ok` and `billingSchema: ok`.
7. Then verify sign-in and billing flows.

The current billing reliability migration is:

    20260929130500_stripe_webhook_reliability

Do not mark that migration as applied unless its columns/table already exist.

### New environments

For a fresh database:

    npx prisma migrate deploy
    npx prisma generate

### Why deployment does not auto-migrate

A preview deployment should not be allowed to mutate a shared production database. Schema changes are therefore treated as an explicit release step, separate from application build/deploy.

Useful validation commands:

    npx prisma validate
    npx prisma migrate status
    npx prisma migrate deploy

## Stripe Test Mode Setup

For local and test deployments:

1. Use Stripe test mode keys.
2. Create a test product and recurring price.
3. Add the test price ID to STRIPE_PRICE_ID.
4. Use the Stripe CLI for local webhook forwarding.
5. Add the generated webhook signing secret to STRIPE_WEBHOOK_SECRET.

Local webhook command:

    stripe listen --forward-to localhost:3000/api/webhook/stripe

## Stripe Production Setup

Before using real payments:

1. Switch to Stripe live mode.
2. Create the live product and recurring price.
3. Replace test keys with live keys in the production environment.
4. Create a live webhook endpoint for `/api/webhook/stripe`.
5. Add the live webhook signing secret to STRIPE_WEBHOOK_SECRET.
6. Test checkout, customer portal, cancellation, and webhook events carefully.

Never mix test keys and live keys.

## Webhook Events Used

The app handles these Stripe events:

- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted

These events keep the local user record in sync with Stripe subscription status.

## Production Verification Checklist

After deployment, confirm:

- Landing page loads
- Sign In / Create Account page loads
- New account creation works
- Existing account sign-in works
- Dashboard is protected
- Notes can be created
- Notes can be deleted with custom confirmation modal
- Free note limit works
- Stripe checkout opens
- Successful checkout returns to dashboard
- Pro status displays correctly
- Stripe Customer Portal opens for Pro users
- Cancellation status updates correctly
- `/api/health` reports database and billing schema ready
- CI passes on pull requests

## Security Notes

Current protections included:

- Password hashing with bcrypt
- Protected dashboard route
- Server-side ownership checks for notes
- Server-only Prisma client usage
- Database-backed rate limiting
- Safe `.env.example` file
- Real `.env` files ignored by Git
- Stripe webhook signature validation

Recommended future improvements:

- Password reset flow
- Email verification flow
- Audit logging
- More server action tests
- Role-based access controls
