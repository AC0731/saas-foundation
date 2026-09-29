# Dependency security register

## Blocking production gate

CI runs:

```bash
npm audit --omit=dev --omit=optional --audit-level=high
```

This gate covers dependencies intended to ship with the application and fails the build on high/critical findings.

## Remediation performed

The security review identified vulnerable framework/auth/runtime packages. The dependency graph was refreshed with:

- patched Next.js 16.3.7
- NextAuth 4.24.15
- Prisma Client / PostgreSQL adapter 7.10.0
- patched Preact 10.29.8

The lockfile is committed so CI and deployment resolve the same versions.

## Prisma CLI/tooling findings

A full dependency audit still reports advisories under Prisma's optional/development CLI graph, including packages pulled by `prisma` for local tooling. The lockfile marks those packages `devOptional`; they are not dependencies of `@prisma/client` runtime itself.

These findings remain tracked rather than silently ignored. The production gate excludes optional/development tooling, while Prisma CLI versions are kept current and should be revisited as upstream packages publish remediations.

## Review rule

Do not use `npm audit fix --force` automatically on this repository. It can propose breaking dependency changes (including major/downgrade paths). Review dependency ownership, runtime exposure, and build compatibility before applying security updates.
