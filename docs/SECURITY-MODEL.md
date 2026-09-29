# Security model

SaaS Foundation treats authentication, tenant data ownership, billing, and webhook processing as separate trust boundaries.

## Trust boundaries

1. **Browser → server actions / auth**
   - Client-supplied user IDs are never trusted for ownership decisions.
   - The current user is resolved from the authenticated server session.
   - Credential signup and sign-in are explicit, separate modes.

2. **Credentials → account record**
   - Email is normalized before lookup.
   - Signup requires a new email and a minimum 12-character password.
   - Password content is preserved exactly and hashed with bcrypt.
   - Sign-in requires an existing password hash.
   - Existing passwordless accounts cannot be converted into credential accounts by submitting an arbitrary password.

3. **User → workspace data**
   - Note deletion scopes the database mutation by both note ID and authenticated user ID.
   - Free-plan limits are enforced server-side.
   - Mutation paths are rate-limited.

4. **Application → Stripe**
   - Price/customer/user relationships are created server-side.
   - Webhook payloads are trusted only after Stripe signature verification.
   - Webhook errors returned to callers are generic; internal verifier detail remains server-side.
   - Webhook responses include a request reference for incident correlation.

5. **Application → database**
   - Prisma provides typed database access.
   - The health endpoint performs a live database query instead of returning a static success response.

## Browser hardening

The application config adds:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- restrictive camera/microphone/geolocation permissions
- `Cross-Origin-Opener-Policy: same-origin`

## Dependency policy

CI blocks high-severity findings in dependencies shipped with the application. Development/optional Prisma CLI tooling is tracked separately because it is not part of the production runtime.

## Production extensions

A larger production system would additionally use verified email flows, password reset, MFA, RBAC, centralized audit logs, secret rotation, database migrations, distributed rate limiting, alerting, and environment-specific CSP rules.
