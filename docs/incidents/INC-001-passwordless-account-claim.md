# INC-001 — Passwordless account claim prevention

**Status:** Resolved  
**Category:** Authentication / account boundary

## Finding

The credentials provider allowed an existing user with `passwordHash = null` to reach the sign-in path. Instead of rejecting the attempt, the application generated a new password hash from the submitted password and stored it on the existing account.

## Risk

A passwordless/imported/provider-backed account could be converted into a credentials account without a dedicated verification flow. Authentication code should never infer account ownership from possession of an email address alone.

## How I found it

While tracing the sign-in path, I found that an existing user without a password hash could fall through to code that created one from the submitted password. I added regression coverage for the expected policy:

- sign-in + existing user + no password hash → **deny**
- sign-in + existing credentials user → **verify existing password**
- signup + unused email → **create**
- signup + existing email → **deny**

The regression failed against the existing implementation, which confirmed the bug before I changed the policy module.

## Fix

- Added a dedicated credential policy module.
- Existing passwordless users are rejected by credentials sign-in.
- Password hashes are created only during explicit signup for an unused email.
- Passwords are no longer trimmed before hashing/comparison.
- Signup now requires at least 12 characters.
- Email normalization and length checks are centralized.

## Verification

The auth policy regression suite passes after the fix, and subsequent CI runs validate the application build and tests.

## Lesson

Authentication mode transitions must be explicit. An existing identity record is not proof that the caller is allowed to establish a new authentication factor.
