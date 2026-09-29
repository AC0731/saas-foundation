# INC-001 — Passwordless account claim prevention

**Status:** Resolved  
**Category:** Authentication / account boundary

## Finding

The credentials provider allowed an existing user with `passwordHash = null` to reach the sign-in path. Instead of rejecting the attempt, the application generated a new password hash from the submitted password and stored it on the existing account.

## Risk

A passwordless/imported/provider-backed account could be converted into a credentials account without a dedicated verification flow. Authentication code should never infer account ownership from possession of an email address alone.

## Reproduction

A regression test was committed first to require the following policy:

- sign-in + existing user + no password hash → **deny**
- sign-in + existing credentials user → **verify existing password**
- signup + unused email → **create**
- signup + existing email → **deny**

That regression commit failed before the policy module existed, preserving the finding in Git history.

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
