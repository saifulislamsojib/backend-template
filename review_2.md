# Backend Template — Code Review

- **Date:** 2026-08-10
- **Branch:** `main` @ `7d2c3d0`
- **Scope:** Full repository — source, tests, Docker/Compose, CI workflows, and project documentation.

## Method

This review is based on a full read of the codebase plus an actual verification run, not static inspection alone:

| Check | Result |
| --- | --- |
| `pnpm typecheck` | ✅ clean |
| `pnpm lint` (`--max-warnings 0`) | ✅ clean |
| `pnpm test` | ✅ 62 tests / 17 files pass |
| `pnpm coverage` | ✅ thresholds met (stmts 84.27, branches 76.74, funcs 83.33, lines 85.38) |
| `pnpm build` | ✅ compiles; tsc-alias resolves paths |
| Empirical checks | ✅ confirmed env drift, Multer 500, tests compiled into `dist/` |

## Overall assessment

Strong, production-oriented Express 5 + TypeScript template. Since the previous review, the major structural and security blockers have been genuinely fixed: configuration is validated before dependencies consume it, CI test bootstrap is repaired, auth no longer returns cookie tokens in JSON to browser clients, login is generic and rate-limited, Redis is namespaced and fault-tolerant (no more `FLUSHALL`), cookies/CORS are environment-aware, Docker gets health checks with `depends_on` readiness, and coverage is enforced in CI.

The remaining gaps are narrower and mostly in three buckets: (1) **config/doc drift** — the `.env.example` still cannot pass startup validation and uses a stale variable name; (2) **error-path hygiene** — upload-limit failures become 500s and raw internal error messages are returned to clients; (3) **rate-limiting/health semantics** — `trust proxy` makes the login rate limit bypassable, and the health endpoint is liveness-only. There is also a set of smaller build and coverage blind spots.

The codebase is clean, consistent, and well-tested for a template. Nothing here is a showstopper, but the config drift in particular will trip up the first person who copies `.env.example`.

## Findings

### High

#### 1. `.env.example` (and the local `.env`) cannot pass startup validation and uses a stale variable name — ✅ Resolved

- **Status:** Fixed. `.env.example` now uses `DB_URI=mongodb://127.0.0.1:27017/backend-template` and `JWT_ACCESS_EXPIRES_IN_MINUTES=10080`; the local `.env` aligns to `JWT_ACCESS_EXPIRES_IN_MINUTES=1440`. A regression test ([env.test.ts](src/configs/env.test.ts)) reads `.env.example`, stubs `process.env`, and asserts the env module loads without `process.exit`, so drift is caught in CI via `pnpm coverage`.
- **Location:** [.env.example](.env.example#L2), [.env.example](.env.example#L6), [src/configs/env.ts](src/configs/env.ts#L6-L33)
- **Verified:** `envValidationSchema.safeParse` against the example fails with `Invalid URL` on `DB_URI`.
- **Problem:**
  - `DB_URI=databaseUrl` is not a valid URL for `z.url()`, so a developer following the README quick start (`cp .env.example .env && pnpm dev`) crashes at startup with a validation error.
  - `.env.example` sets `JWT_ACCESS_EXPIRES_IN=1d`, but the schema (and README) expect `JWT_ACCESS_EXPIRES_IN_MINUTES`. Zod silently drops unknown keys, so the intended 1-day expiry is ignored and the 7-day default (10080 minutes) applies. The committed local `.env` has the same drift.
- **Recommendation:** Make the example environment self-consistent: `DB_URI=mongodb://127.0.0.1:27017/backend-template`, and rename `JWT_ACCESS_EXPIRES_IN` to `JWT_ACCESS_EXPIRES_IN_MINUTES`. Add a test that parses the documented example, and a CI step that validates `.env.example` against `envValidationSchema`.

#### 2. Upload size-limit failures return 500, and uploads still trust client-supplied MIME types

- **Location:** [src/middleware/globalErrorhandler.ts](src/middleware/globalErrorhandler.ts#L23-L60), [src/middleware/uploader.ts](src/middleware/uploader.ts#L5-L15), [src/middleware/memory.uploader.ts](src/middleware/memory.uploader.ts#L7-L17)
- **Verified:** submitting a >2MB file to the uploader returns `500 {"message":"File too large","type":"serverError"}`.
- **Problem:**
  - `MulterError` (e.g. `LIMIT_FILE_SIZE`) matches none of the global handler's branches, so it becomes a 500 `serverError` instead of a stable `413 Payload Too Large`. The raw message also leaks.
  - Both uploaders validate only `file.mimetype`, which is client-controlled and spoofable. Disk uploads land in a relative `uploads/` directory with no lifecycle management, and `uploads/` is **not** in [.gitignore](.gitignore), so files can be committed by accident.
- **Recommendation:** Map `MulterError` to a typed 4xx (413 for size, 400 otherwise) in the global handler. Validate content via magic bytes (e.g. `file-type`), generate controlled filenames, store outside the app filesystem or in object storage, clean up rejected/failed uploads, and add `uploads/` to `.gitignore`.

#### 3. Internal error messages are returned to clients on 500 responses

- **Location:** [src/middleware/globalErrorhandler.ts](src/middleware/globalErrorhandler.ts#L23-L25)
- **Problem:** For unexpected errors, `message = err.message` is sent to the client in every environment. Database, filesystem, and third-party error strings (paths, URIs, driver internals) are exposed. The PII redaction added to the logger protects **logs** only, not **responses**.
- **Recommendation:** For `INTERNAL_SERVER_ERROR`, respond with a generic message (e.g. "Something went wrong") and keep details in the server log. Reserve `err.message` for mapped/expected errors. Add a test asserting a generic body for unexpected errors in `production`/`staging`.

#### 4. Auth rate limit is bypassable via `X-Forwarded-For` spoofing

- **Location:** [src/app.ts](src/app.ts#L23) (`app.enable("trust proxy")`), [src/middleware/rateLimiter.ts](src/middleware/rateLimiter.ts#L21-L51)
- **Problem:** `trust proxy` is enabled in the fully-open `true` mode, so `req.ip` reflects whatever the client sends in `X-Forwarded-For`. `express-rate-limit` keys on `req.ip` by default, so the 5-attempt/10-minute auth limit can be rotated around by changing the header. If the server is reachable directly, this defeats the main abuse protection on login/register.
- **Recommendation:** Set `trust proxy` to a concrete hop count or an explicit proxy allowlist (e.g. `app.set("trust proxy", 1)`), and key the auth limiter on a composite of account + stable IP once the proxy trust is bounded. Only `authRateLimiter` exists today — document or add limits for the remaining authenticated endpoints.

### Medium

#### 5. Same-second password-change token bypass

- **Location:** [src/middleware/authCheck.ts](src/middleware/authCheck.ts#L43-L48), [src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts#L80-L92)
- **Problem:** Old tokens are invalidated only when `passwordUpdatedAt` (stored as a `Date`, second granularity) is strictly greater than the JWT `iat` (also seconds). A token issued in the same second as the password change remains valid. This was flagged in the previous review and is still open.
- **Recommendation:** Store a per-user `tokenVersion` (or millisecond-precision credential timestamp) on the user document and include it in the JWT; reject tokens whose version is behind. Optionally revoke all sessions on password change.

#### 6. Health endpoint is liveness-only — it reports "up" even when DB/Redis are down

- **Location:** [src/modules/health/health.controller.ts](src/modules/health/health.controller.ts#L6-L16), [compose.yml](compose.yml#L37-L46)
- **Problem:** The health handler returns `200 up` without probing MongoDB or Redis. The Compose health check (and any orchestrator) therefore can't detect a dependency failure, and a service with a dead database keeps "healthy". There is no separate readiness endpoint.
- **Recommendation:** Expose `/health/live` (process alive) and `/health/ready` (checks `mongoose.connection.readyState` and a Redis `PING`), and point the Compose health check at the readiness endpoint.

#### 7. `process.exit(1)` from library code; the bootstrap error path is untestable and partially dead

- **Location:** [src/configs/env.ts](src/configs/env.ts#L35-L40), [src/configs/db.ts](src/configs/db.ts#L16-L19), [src/server.ts](src/server.ts#L18-L21)
- **Problem:** `dbConnect` catches its own failure and calls `process.exit(1)`, so `main().catch()` in [server.ts](src/server.ts#L18) is unreachable for DB failures. The env-validation exit path is likewise untested (only the schema, not the module behavior, is covered). This also makes graceful shutdown impossible on DB failure — `closeServer` never runs.
- **Recommendation:** Throw a typed startup error instead of calling `process.exit`; let `main()` (or a top-level runner) decide whether to exit. Cover the "invalid env" and "DB connect failure" paths in tests by mocking `process.exit`.

#### 8. Bootstrap and shutdown have zero test coverage

- **Location:** `src/server.ts` (0%), [src/utils/server.ts](src/utils/server.ts) (0%), [src/configs/logger.ts](src/configs/logger.ts) (50%), [src/configs/redis.ts](src/configs/redis.ts) (62.5%)
- **Problem:** Overall thresholds pass, but the entire startup path, graceful shutdown, `closeServer`, signal handlers, and the Redis error/connect handlers are untested. These are the highest-risk paths in a deployment and the easiest to break silently.
- **Recommendation:** Add tests for `closeServer` (HTTP close + `redisClient.quit` + `dbDisconnect`), signal handling, and the logger/redis bootstrap edge cases.

#### 9. Production build emits test files into `dist/`

- **Location:** [tsconfig.json](tsconfig.json#L43)
- **Verified:** `pnpm build` produces `dist/**/*.test.js` and `dist/test/*.js` (apiTester, globalSetup, setupFile, utils).
- **Problem:** `include: ["src/*.ts", "src/**/*.ts"]` compiles tests and the memory-server test harness into the production output. The Docker build happens to exclude them via `.dockerignore`, but a local `pnpm build && pnpm start` ships test code. It also couples the test harness to the prod emit.
- **Recommendation:** Exclude `**/*.test.ts` and `src/test/**` from the build emit (keep them type-checked via a separate `tsconfig` for tests or by the `typecheck` pass). Alternatively, exclude via `tsc` `exclude`.

### Low / notes

#### 10. Numeric env values are parsed without NaN or range checks

- **Location:** [src/configs/env.ts](src/configs/env.ts#L11-L32)
- **Problem:** `PORT`, `REDIS_PORT`, `BCRYPT_SALT_ROUNDS`, `JWT_ACCESS_EXPIRES_IN_MINUTES`, and `REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS` use bare `parseInt`. A value like `PORT=abc` parses to `NaN` and passes Zod, then crashes later at `server.listen(NaN)`; `BCRYPT_SALT_ROUNDS=abc` produces `NaN` at bcrypt time. Ports are also not bounded to `0–65535`.
- **Recommendation:** Use `z.coerce.number().int().min(...).max(...)` (and require positive integers for the rest) so the schema itself rejects bad input.

#### 11. `x-app-key` check is not constant-time; app key is a single static secret

- **Location:** [src/modules/auth/auth.utils.ts](src/modules/auth/auth.utils.ts#L62-L64)
- **Problem:** `req.get(X_APP_KEY) === env.APP_KEY` is a length-leaking string comparison. The dual auth model (documented in the README) is a reasonable trade-off, but there is no rotation or per-client key story, and any leak of the key turns every login into a bearer-token response.
- **Recommendation:** Compare with `crypto.timingSafeEqual` over fixed-length digests, and consider per-client key material with rotation rather than one shared secret.

#### 12. Documentation drift in the testing section

- **Location:** [README.md](README.md#L187), [src/test/globalSetup.ts](src/test/globalSetup.ts#L3-L17)
- **Problem:** The README says tests load `.env.test` and require Redis. In reality `globalSetup.ts` hardcodes the test environment values directly, no `.env.test` exists, and Redis is mocked in the unit tests (only the rate limiter exercises the real in-memory path).
- **Recommendation:** Update the README to describe what the setup actually does.

#### 13. Body size limits are inconsistent

- **Location:** [src/app.ts](src/app.ts#L25)
- **Problem:** `express.json()` uses the Express default (100 kb) while `express.urlencoded()` is set to 5 mb. Routes that take larger JSON bodies will unexpectedly fail while URL-encoded bodies won't.
- **Recommendation:** Set an explicit, documented limit on both parsers.

#### 14. Long-lived access token without refresh rotation

- **Location:** [src/configs/env.ts](src/configs/env.ts#L11-L14), [src/modules/auth/auth.utils.ts](src/modules/auth/auth.utils.ts#L33-L37)
- **Problem:** A 7-day access token in a cookie with no refresh/rotation lifecycle is acceptable for a template but should be a documented decision. Password changes only invalidate tokens via the second-granularity check (finding 5), not by revoking all sessions.
- **Recommendation:** If browser auth is a target, add short-lived access tokens with refresh-token rotation, and bump `tokenVersion` on password changes.

## Scores

| Area | Score |
| --- | ---: |
| Architecture | 7/10 |
| Code Quality | 7/10 |
| Security | 5/10 |
| Performance | 6/10 |
| Maintainability | 7/10 |
| Production Readiness | 5/10 |

## Top priorities

1. ~~Fix `.env.example` so it passes validation, and align `JWT_ACCESS_EXPIRES_IN` → `JWT_ACCESS_EXPIRES_IN_MINUTES` (also in `.env`).~~ — ✅ Done
2. Map `MulterError` to a typed 413/400 and stop returning internal error messages on 500s.
3. Harden the auth rate limit: concrete `trust proxy` and a composite IP+account key.
4. Add content-based upload validation and manage uploaded-file lifecycle.
5. Make the health endpoint readiness-aware (DB + Redis probes).
6. Close the same-second token bypass with a token version.
7. Replace `process.exit` in library code with thrown startup errors; cover bootstrap/shutdown in tests.
8. Exclude test files from the production build emit.

## What was fixed since the previous review

These items from the earlier review were verified as resolved in the current code:

- Env validation now runs before dependencies consume values (module evaluation order in [src/configs/env.ts](src/configs/env.ts)).
- CI/in-memory MongoDB bootstrap sets `DB_URI` and required vars before app import ([src/test/globalSetup.ts](src/test/globalSetup.ts)).
- Auth uses one transport per client type; JSON tokens are gated behind `x-app-key` ([README.md](README.md#L113-L123)).
- Generic `401 Invalid email or password` with a dummy bcrypt comparison and auth rate limiting ([src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts#L31-L53), [src/middleware/rateLimiter.ts](src/middleware/rateLimiter.ts#L57-L61)).
- Environment-aware cookies (`Secure` only outside development, `SameSite=Lax`) and single-origin CORS with credentials ([src/modules/auth/auth.utils.ts](src/modules/auth/auth.utils.ts#L66-L83), [src/app.ts](src/app.ts#L22)).
- Redis cache is namespaced (`REDIS_CACHE_KEY_PREFIX`), fault-tolerant, and single-flight; `FLUSHALL` removed ([src/utils/redis.ts](src/utils/redis.ts)).
- Expanded middleware/error/cache/upload tests with coverage thresholds enforced in CI ([vitest.config.ts](vitest.config.ts#L10-L21)).
- Docker: multi-stage non-root image, health checks, `depends_on: service_healthy`, correct Redis `/data` mount, no Redis port published in prod/stage Compose ([compose.yml](compose.yml)).

## Roadmap

**Phase 1 — onboarding blockers**
- Fix `.env.example` (valid URL + correct var names); add a CI check that parses it.
- Update the README testing section to match the real setup.

**Phase 2 — error-path hardening**
- Map `MulterError` to 413/400; add content-based upload validation and storage lifecycle.
- Return generic bodies on 500s; keep details server-side.
- Bounded `trust proxy`; composite rate-limit key.

**Phase 3 — operations**
- Readiness/liveness split for the health endpoint; point Compose at readiness.
- Token versioning to close the same-second bypass; document refresh-token roadmap.
- Tests for startup/shutdown/signal paths; keep tests out of `dist/`.

**Phase 4 — template scalability**
- `z.coerce.number()` env parsing with bounds; per-client app keys; log centralization and rotation for file logs; DB index review and pagination conventions for new modules.
