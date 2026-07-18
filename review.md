# Backend Code Review

## Overall assessment

This is a usable starter, but it is not production-ready as a reusable backend template yet. The largest gaps are environment bootstrap order, broken CI test initialization, authentication/session security, Redis exposure, and missing abuse protections. The feature structure is understandable, but several shared utilities encode unsafe defaults that downstream projects would inherit.

## Findings

### 1. Environment validation occurs after configuration has already been consumed

- **Severity:** High
- **Location:** `src/server.ts` imports; `src/configs/index.ts`; `src/utils/catchEnvValidation.ts`
- **Problem:** `configs`, logger, Redis, database, and the HTTP server are imported before validation runs. `configs` permanently captures raw/unvalidated values, including `NaN` ports and undefined secrets. Validation therefore cannot protect dependency initialization.
- **Recommendation:** Parse environment exactly once before constructing dependencies, and use the parsed result as the application configuration. Avoid calling `process.exit()` from a validation utility; throw a typed startup error instead.

```ts
const env = envSchema.parse(process.env);

export const configs = {
  port: env.PORT,
  dbUri: env.DB_URI,
  jwtAccessSecret: env.JWT_ACCESS_SECRET,
} as const;
```

### 2. CI test database configuration is initialized too late

- **Severity:** Critical
- **Location:** `src/test/globalSetup.ts`; `src/test/setupFile.ts`; `.github/workflows/code-checker.yml`
- **Problem:** `globalSetup.ts` imports `logger`, which imports `configs` before `process.env.DB_URI` is replaced with the in-memory MongoDB URI. In CI, `.env.test` is ignored and no `DB_URI` is provided. `configs.db_uri` can remain undefined when `dbConnect()` runs.
- **Recommendation:** Ensure environment setup occurs before importing anything that imports `configs`. Remove the logger dependency from global setup, set `DB_URI` first, and add a CI regression test or explicitly supply every required environment value.

### 3. The documented example environment cannot pass validation

- **Severity:** High
- **Location:** `.env.example`; `src/utils/catchEnvValidation.ts`
- **Problem:** `CLIENT_ORIGIN=*` is not a valid URL under `z.url()`. A developer following the example will fail startup validation.
- **Recommendation:** Either support `*` explicitly or use a valid example such as `http://localhost:3000`. Production configuration should support an allowlist of origins.

### 4. Authentication returns a bearer token despite setting an HttpOnly cookie

- **Severity:** High
- **Location:** `src/modules/auth/auth.service.ts`; `src/modules/auth/auth.controller.ts`; `src/modules/auth/auth.utils.ts`
- **Problem:** Login and registration return the JWT in JSON and set it in an HttpOnly cookie. Returning it to JavaScript defeats the main XSS protection provided by HttpOnly cookies.
- **Recommendation:** Choose one model: cookie-based browser authentication without exposing tokens in JSON, or bearer-token API authentication without an authentication cookie. Document both patterns rather than enabling both by default.

### 5. Cookie/CORS defaults are unsafe and inconsistent

- **Severity:** High
- **Location:** `src/modules/auth/auth.utils.ts`; `src/app.ts`
- **Problem:** Cookies are always `Secure` and `SameSite=None`, which breaks local HTTP development. `SameSite=None` also requires CSRF protection for cookie-authenticated mutations. CORS does not set `credentials: true`, so cross-origin browser clients cannot reliably use the cookie.
- **Recommendation:** Make cookie settings environment-aware, implement CSRF protection for cookie sessions, and configure explicit allowed origins plus credentials only when needed.

### 6. Login leaks account existence and has no abuse protection

- **Severity:** High
- **Location:** `src/modules/auth/auth.service.ts` (`loginUserFromDb`)
- **Problem:** Unknown email returns `404 User not found`; incorrect password returns `400 Password is not valid`. This enables account enumeration. There is also no rate limiting, lockout/backoff, or IP/account throttling on login and registration.
- **Recommendation:** Always return a generic `401 Invalid email or password`, run a dummy bcrypt comparison for absent users, and add route-specific rate limits. Add audit events for repeated authentication failures.

### 7. Password-change token invalidation has a same-second bypass

- **Severity:** Medium
- **Location:** `src/middleware/authCheck.ts`; `src/modules/auth/auth.service.ts` (`changePasswordToDb`)
- **Problem:** Token invalidation only rejects if `passwordUpdatedAt > iat`. Both values are second-granularity, so a token issued earlier in the same second as the password change remains valid.
- **Recommendation:** Use a session/token version stored on the user, or store and compare millisecond-safe credential timestamps. Revoke all existing sessions on password changes.

### 8. Upload validation trusts attacker-controlled MIME types

- **Severity:** High
- **Location:** `src/middleware/uploader.ts`; `src/middleware/memory.uploader.ts`
- **Problem:** `file.mimetype` is supplied by the client and can be spoofed. Disk uploads are written to a local relative `uploads/` directory, with no lifecycle management, malware scanning, content inspection, or storage abstraction.
- **Recommendation:** Validate magic bytes using a trusted file-type library, generate controlled filenames, store uploads outside the application filesystem or in object storage, and delete rejected/failed uploads. Map `MulterError` to a stable 4xx API response.

### 9. Redis is publicly exposed and lacks authentication

- **Severity:** Critical
- **Location:** `compose.yml`; `docker-compose.dev.yml`; `docker-compose.stage.yml`
- **Problem:** Redis publishes `6379` on all interfaces in every Compose configuration and has no password or TLS configuration. A host reachable from a network can expose cached data and permit destructive Redis commands.
- **Recommendation:** Do not publish Redis in production/staging; keep it on the internal Compose network. Require ACL/password credentials and TLS for external Redis providers.

### 10. Cache utility can destroy unrelated Redis data

- **Severity:** High
- **Location:** `src/utils/redis.ts` (`clearAllCache`)
- **Problem:** `clearAllCache()` invokes `FLUSHALL`, deleting every Redis database's data, not just this application's cache. This is dangerous for shared Redis deployments.
- **Recommendation:** Remove this helper or replace it with versioned, namespaced keys such as `app-name:v2:*`. Never expose global flush behavior as an ordinary application utility.

### 11. Cache failures and corruption can fail otherwise healthy requests

- **Severity:** Medium
- **Location:** `src/utils/redis.ts`; `src/middleware/cacheRoute.ts`
- **Problem:** A Redis outage or malformed cached JSON throws through `catchAsync` and turns a cache issue into an API failure. The get-or-set pattern also permits cache stampedes under concurrent misses.
- **Recommendation:** Treat caching as best-effort for non-critical data: log cache errors, invalidate malformed values, continue to the database, namespace keys, and use locking/single-flight where needed.

### 12. Test coverage is too narrow for a template

- **Severity:** High
- **Location:** `src/modules/auth/auth.test.ts`; `src/modules/health/health.test.ts`; `vitest.config.ts`
- **Problem:** Tests cover a small happy-path auth slice and health endpoint. There are no tests for configuration validation, global error mapping, CORS/cookie behavior, cache behavior/failure, upload limits, shutdown, or authorization role boundaries. No coverage thresholds exist.
- **Recommendation:** Add integration tests for every shared middleware and contract tests for the response envelope. Add coverage thresholds for lines, branches, and functions; run coverage in CI.

### 13. Docker readiness is incomplete

- **Severity:** Medium
- **Location:** `Dockerfile`; `compose.yml`
- **Problem:** The production image has no health check, no `EXPOSE`, and Compose starts the API after Redis merely starts—not after it is healthy. The image build does not run tests or typecheck. Redis data is mounted at `/var/lib/redis`, whereas the official Redis image normally persists under `/data`.
- **Recommendation:** Add Docker health checks, `depends_on.condition: service_healthy`, correct the Redis data mount, and separate CI verification from image packaging. Prefer immutable image tags/digests for deployment.

### 14. Response and error contracts are inconsistent

- **Severity:** Medium
- **Location:** `src/routes/root.routes.ts`; `src/modules/health/health.controller.ts`; `src/middleware/globalErrorhandler.ts`
- **Problem:** Most responses use `sendResponse`, while root and health use custom shapes. Some expected authentication failures are `400` or `404`, while others are `401`. This makes a shared client contract harder to implement and preserves account enumeration.
- **Recommendation:** Define a versioned response/error contract and apply it consistently, including health endpoints where practical. Use `401` for invalid credentials and `403` for authenticated-but-insufficient permissions.

### 15. Logging can retain PII without operational controls

- **Severity:** Medium
- **Location:** `src/middleware/globalErrorhandler.ts`; `src/configs/logger.ts`
- **Problem:** Error logs include user email and can be written to local files without retention, rotation, redaction, or central transport. This creates privacy and disk-exhaustion risks.
- **Recommendation:** Redact secrets and minimize PII, implement retention/rotation, emit structured request IDs, and send production logs to managed centralized logging.

## Scores

| Area                 | Score |
| -------------------- | ----: |
| Architecture         |  6/10 |
| Code Quality         |  6/10 |
| Security             |  3/10 |
| Performance          |  5/10 |
| Maintainability      |  5/10 |
| Production Readiness |  3/10 |

## Top 10 priorities

1. Fix configuration parsing order and use parsed config values.
2. Fix CI/in-memory MongoDB setup so `DB_URI` is available before config imports.
3. Remove Redis public port exposure; require authenticated internal Redis.
4. Choose a single authentication transport; do not return cookie tokens in JSON.
5. Add rate limiting and generic authentication failure responses.
6. Add CSRF protection and environment-aware cookie/CORS settings.
7. Replace MIME-only upload validation with content inspection and managed storage.
8. Remove `FLUSHALL`; namespace cache keys and degrade gracefully on cache failure.
9. Expand test coverage and enforce coverage in CI.
10. Add health checks, dependency readiness, correct persistence mounts, and production observability.

## Prioritized refactoring roadmap

### Phase 1 — deployment blockers

- Centralize validated configuration and repair test bootstrap.
- Secure Redis networking and remove global cache flushing.
- Fix auth token transport, cookie policy, CSRF, login enumeration, and rate limits.
- Correct `.env.example`.

### Phase 2 — shared-platform hardening

- Introduce typed API errors and a uniform response contract.
- Add upload content validation, error mapping, and an object-storage boundary.
- Make Redis cache operations fault-tolerant and namespaced.
- Add request IDs, PII redaction, log rotation, and health/readiness endpoints.

### Phase 3 — quality gates

- Add middleware, auth-boundary, error-handler, cache, upload, and shutdown tests.
- Enforce coverage thresholds and add dependency/security scanning in CI.
- Ensure Docker Compose uses health checks and correct Redis persistence.

### Phase 4 — scalable template foundations

- Add pagination/filtering conventions, database index review guidance, and query projection defaults.
- Add session/token versioning and refresh-token lifecycle support if browser auth is a target.
- Document production deployment topology, secret management, backups, and observability expectations.
