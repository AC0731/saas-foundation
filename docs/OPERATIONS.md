# Operations

## Health endpoint

`GET /api/health` performs a database query and returns:

```json
{
  "status": "ready",
  "checks": {
    "database": "ok"
  }
}
```

The response is marked `Cache-Control: no-store`.

A database failure returns HTTP 503 with a generic status body while the server logs the internal error.

## CI quality gates

The build pipeline checks:

- production dependency audit
- ESLint
- Prisma schema validation
- Prisma Client generation
- Vitest regression tests
- production Next.js build

## Change verification

For auth/billing changes, validate at minimum:

- existing credentials sign-in
- new-account signup
- rejection of existing passwordless account in credentials sign-in
- note ownership controls
- checkout/portal authorization
- webhook signature rejection
- subscription created/updated/deleted state handling
- database readiness
- production build

## Incident priority

Treat authentication bypass, cross-user data access, billing entitlement errors, or leaked secrets as security-impacting incidents. Keep evidence sanitized and do not paste credentials, webhook secrets, password hashes, or session tokens into tickets.
