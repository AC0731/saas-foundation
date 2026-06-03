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

## Database Setup

This project uses Prisma with PostgreSQL.

Recommended production workflow:

1. Create a managed PostgreSQL database.
2. Add the production DATABASE_URL to the hosting environment.
3. Run Prisma validation locally before deployment.
4. Run Prisma schema sync or migrations carefully.

For this portfolio project, `npx prisma db push` has been used during development. For a long-term production application, Prisma migrations should be used instead.

Useful commands:

    npx prisma validate
    npx prisma generate
    npx prisma db push

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
- Production migration workflow
