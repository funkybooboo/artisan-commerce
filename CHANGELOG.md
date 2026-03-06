# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For changelog guidelines, see [Project Standards](./docs/developer/standards/project-standards.md#changelog).

---

## [Unreleased]

---

## [0.2.0] - 2026-03-05

### Added
- Magic link authentication flow (`POST /api/auth/register`, `GET /api/auth/verify`)
- JWT session management with httpOnly cookie (`POST /api/auth/logout`, `GET /api/auth/me`)
- User profile CRUD (`GET /api/users/me`, `PATCH /api/users/me`)
- RBAC middleware (`requireRole`) and geo-restriction middleware (`requireUtahIp`)
- In-memory rate limiting middleware with injectable `BucketStore`
- `AuthError` with typed codes (`EXPIRED`, `INVALID`, `MISSING`) in `packages/shared`
- `signMagicLinkToken`, `verifyMagicLinkToken`, `signSessionToken`, `verifySessionToken` in `packages/shared`
- Canonical `Role` and `Address` types in `packages/shared/src/types/index.ts`
- `CorsConfig` type and `corsConfigFromOptions` helper in `apps/api/src/config.ts`
- `SentEmailStore` interface and `InMemoryEmailStore` class separated from `InMemoryEmailProvider`
- `loginAndGetCookie` shared test helper in `apps/api/tests/helpers/auth.ts`
- Migration auto-discovery in `apps/api/tests/helpers/db.ts` via `readdirSync`

### Changed
- CORS origins moved from hardcoded array in `index.ts` to `CORS_ORIGINS` env binding and config
- Magic link expiry text in email body now computed from `config.magicLinkExpirySeconds`
- `geo.ts` uses `config.allowedRegion` instead of hardcoded `'UT'`
- `jwt.ts` expired-token check replaced with `isJwtExpiredError` helper using `err.message.includes('exp')`
- `rate-limit.ts` import changed from `'@artisan-commerce/api'` to relative `'../index'`
- `hono` moved from `devDependencies` to `dependencies` in `packages/shared/package.json`
- `better-sqlite3` moved from `devDependencies` to `dependencies` in `packages/db/package.json`
- Root `tsconfig.json` stripped of emit-only options (`composite`, `incremental`, `declaration`, `declarationMap`, `sourceMap`); all packages use `tsc --noEmit` via workspace resolution, not project references
- All package tsconfigs simplified: removed `outDir`, `references`, and redundant `paths`
- `packages/db/tsconfig.json` adds `types: ["@cloudflare/workers-types"]` for `D1Database`

### Fixed
- `resend.provider.ts` field names corrected to match current Resend SDK (`reply_to` -> `replyTo`, `content_type` -> `contentType`, batch response shape `data?.map` -> `data?.data?.map`)
- Pre-existing `rootDir` incompatibility in `packages/adapters/tsconfig.json` and `packages/shared/tsconfig.json`

---

<!-- Add new versions above this line using the template below -->

<!--
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features or capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in a future release

### Removed
- Features removed in this release

### Fixed
- Bug fixes

### Security
- Security fixes and vulnerability patches

[X.Y.Z]: https://github.com/funkybooboo/artisan-commerce/compare/vX.Y.Z-1...vX.Y.Z
-->

[Unreleased]: https://github.com/funkybooboo/artisan-commerce/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/funkybooboo/artisan-commerce/compare/v0.1.0...v0.2.0
