# Vercel Preview environment

Vercel Preview deployments do not receive production database or billing secrets.

The application therefore treats an unconfigured Preview database differently from Production:

- Prisma schema generation/validation receives a non-routable local placeholder URL so the build can compile without production credentials.
- The runtime database client receives the same placeholder only in Vercel Preview when `DATABASE_URL` is absent.
- `/api/health` reports `status: preview`, `database: not-configured`, and `billingSchema: not-checked` instead of attempting a database connection.
- Production, local development, and other environments still require an explicit `DATABASE_URL`.
- No production Stripe, authentication, or database secret is copied into Preview.

GitHub CI contains a separate `Vercel preview build without secrets` job to catch regressions in this boundary before a PR is merged.
