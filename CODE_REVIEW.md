# Code review — 2026-11-17

## Scope

Reviewed HEAD `4d0b90c0ee299d253e48511d7e084dd4c75a1ac7`: runtime and test source, tracked root configuration, documentation, CI, hooks, and deployment files. Lockfile review targeted the importer and direct dependency pins. Runtime/test review was shared by the coordinator and auth reviewer; deployment review covered the remaining tracked configuration and documentation.

Generated files, `node_modules`, local secrets, and log data were excluded. This report adds no application fixes and preserves `CODE_REVIEW.md`.

## Validation

- Previously completed: `pnpm lint` **PASS**, `pnpm typecheck` **PASS**, `pnpm test` **PASS** (21 files, 95 tests).
- Verification below records the review team's completed probes and static inspection; tests were not rerun while writing this report.
- Docker reproductions used an **existing local application image**, not a fresh build of this HEAD; Dockerfile and Compose conclusions were also checked against source.
- Passing tests do not cover all reported behavior. Mocks miss live Redis offline queuing and failure-path shutdown; normal test mode also disables HTTP request logging and skips auth limiting by default.

## Prioritized findings

### 1. P1 — HTTP completion logs expose authentication cookies

**Location:** `src/configs/logger.ts:59-62`; `src/app.ts:29-39`; `src/modules/auth/auth.utils.ts:76-82`.

- **Trigger / impact:** Register, login, or change password with HTTP logging enabled. Incoming credentials are redacted, but `res.headers["set-cookie"]` is not, exposing a usable JWT to log readers and log storage.
- **Verification:** Actual `pinoHttp` default completion logging with an actual auth cookie retained the token in the response headers.
- **Fix:** Add response `set-cookie` redaction, including `res.headers["set-cookie"]`, and verify completion logs cannot contain the issued token.

### 2. P1 — Direct clients can bypass auth rate limits with forwarded IPs

**Location:** `src/app.ts:23`; `compose.yml:29-30`; `src/middleware/rateLimiter.ts:57-60`; `src/modules/auth/auth.route.ts:12-13`.

- **Trigger / impact:** Connect directly to the publicly published application port and vary `X-Forwarded-For`. Unconditional one-hop proxy trust lets clients change the IP used for register/login rate limiting, bypassing the five-attempt limit.
- **Verification:** A probe using the actual `createRateLimiter` accepted five requests from one IP, then returned 429; changing the forwarded IP returned 200.
- **Fix:** Trust only explicitly configured proxy addresses and restrict direct access when deployed behind a proxy. Disable proxy trust for direct deployments.

### 3. P1 — Uploader tests recursively delete real local uploads

**Location:** `src/middleware/uploader.test.ts:43-46`; `src/middleware/uploader.ts:11-12`.

- **Trigger / impact:** Run `pnpm test` in a working directory containing real `uploads`. Every uploader test's cleanup recursively removes that directory, destroying unrelated local files.
- **Verification:** Static inspection confirms the test imports the same `UPLOADS_DIR` used by the uploader: `path.join(process.cwd(), "uploads")`. No destructive reproduction was required.
- **Fix:** Inject a dedicated per-test temporary upload directory and remove only that directory during cleanup.

### 4. P2 — Same-second password changes leave earlier tokens valid

**Location:** `src/middleware/authCheck.ts:43-45`.

- **Trigger / impact:** Issue a token and change the password within the same second. Flooring the change timestamp and comparing with `>` preserves the earlier token, defeating password-change revocation in that interval.
- **Verification:** An in-memory database probe returned 200 from `/me` with the old token after the change; the replacement token was identical.
- **Fix:** Atomically increment a persisted token version with password changes and validate that version on requests. Changing only `>` to `>=` also invalidates the same-second replacement token.

### 5. P2 — Password validation permits bcrypt-equivalent passwords

**Location:** `src/modules/auth/auth.validation.ts:3-21`; `src/modules/auth/auth.utils.ts:14-25`.

- **Trigger / impact:** Submit passwords longer than bcrypt's 72-byte input limit. Distinct suffixes are silently ignored, so different accepted passwords authenticate as the same credential.
- **Verification:** `"Aa1!" + "x".repeat(68) + "FIRST"` and the same prefix ending in `"SECOND"` both authenticated.
- **Fix:** Enforce a maximum of 72 UTF-8 bytes consistently across password inputs, or migrate to a hashing algorithm that supports the intended input length.

### 6. P2 — Saving an existing user hashes an absent or already-hashed password

**Location:** `src/modules/user/user.model.ts:26-30,45-47`.

- **Trigger / impact:** A model consumer loads an existing user, changes an ordinary field, and calls `save()`. With the default projection, the missing password causes hashing to throw; with `+password`, the stored hash is hashed again and login breaks. Current routes do not expose a profile-save operation; this affects model consumers.
- **Verification:** Both cases were reproduced with an in-memory database.
- **Fix:** Return from the pre-save hook unless `this.isModified("password")` is true, then hash only the changed plaintext password.

### 7. P2 — Invalid JSON and oversized JSON are reported as server failures

**Location:** `src/middleware/globalErrorhandler.ts:24-27,29-72`; `src/app.ts:21`.

- **Trigger / impact:** Send malformed JSON or JSON over the parser's default 100 KB limit. Parser errors fall through to 500 instead of 400/413, misleading clients and producing fatal-level logs for client input errors.
- **Verification:** Supertest against the actual app returned 500 for both inputs.
- **Fix:** Explicitly map recognized body-parser error types such as `entity.parse.failed` and `entity.too.large` to controlled 400 and 413 responses.

### 8. P2 — Redis outages can leave cache and auth-limit requests waiting indefinitely

**Location:** `src/configs/redis.ts:7-12`; `src/utils/redis.ts:44-48`; `src/middleware/rateLimiter.ts:43-46`; `src/modules/auth/auth.route.ts:12-13`.

- **Trigger / impact:** Redis is unreachable while the client is connecting or reconnecting. Default offline queuing and no command deadline keep promises pending, so cache catch blocks never provide a timely fallback. Register/login also actively use this client through the rate limiter's `sendCommand`, making the outage relevant to live auth routes.
- **Verification:** The installed `createClient` against an unreachable endpoint left `get` pending after 250 ms; source provides no command deadline and retains default reconnect behavior. The probe establishes pending behavior, while configuration establishes the absence of an application bound.
- **Fix:** Disable offline queuing, check readiness, and bound command execution. Cache consumers may fall back; the auth limiter must return a controlled dependency failure rather than silently bypassing rate-limit enforcement.

### 9. P2 — Redis teardown failures prevent exit and re-enter shutdown

**Location:** `src/utils/server.ts:15-19`; `src/server.ts:23-25`.

- **Trigger / impact:** Shut down with Redis already closed or disconnected. A rejected `quit()` skips `process.exit` and produces an unhandled rejection that calls `closeServer` again; an offline queued quit can instead leave teardown pending.
- **Verification:** The installed client's `quit()` on a closed client rejected with `ClientClosedError`. Static control-flow inspection confirms the uncaught promise rejection and shutdown re-entry path.
- **Fix:** Guard shutdown against re-entry, settle cleanup failures with `allSettled`/`finally`, and enforce a bounded teardown deadline before exiting with the intended code.

### 10. P2 — Fresh Linux log bind mounts can prevent container startup

**Location:** `compose.yml:26-27`; `docker-compose.stage.yml:26-27`; `Dockerfile:38`; `.env.example:8`; `src/configs/logger.ts:19-36`.

- **Trigger / impact:** Start Compose on a fresh Linux host where Docker auto-creates `./logs` as root-owned, with example file logging enabled. The application runs as `node` (UID 1000) and cannot create log files in the mounted directory, causing startup failure.
- **Verification:** A reproduction using the existing local application image exited with `EACCES` under equivalent mount permissions; no fresh image build was performed.
- **Fix:** Provision the host log directory with ownership writable by the container user before startup, or use stdout logging for containers.

### 11. P2 — The production image defaults to a logger dependency it omits

**Location:** `Dockerfile:18,29-40`; `src/configs/env.ts:7`; `src/configs/logger.ts:10-12`.

- **Trigger / impact:** Launch the image directly with required settings but without `NODE_ENV`. Environment validation defaults to development, so the logger imports `pino-pretty`, which production dependencies omit, and startup fails. Compose explicitly sets `NODE_ENV` and is unaffected by this particular defect.
- **Verification:** The existing local application image reproduced the missing-`pino-pretty` failure; source confirms the production-only dependency installation and missing image-level environment default.
- **Fix:** Set `ENV NODE_ENV=production` in the runtime stage. Document that an env file explicitly setting development overrides this default and is unsuitable for the production-only image.

### 12. P2 — Numeric environment transforms accept invalid settings

**Location:** `src/configs/env.ts:11-14,19-31`.

- **Trigger / impact:** Supply nonnumeric or negative values. `parseInt` transforms have no finite, integer, or range validation, allowing invalid settings through startup checks: a NaN port cannot validly listen, a `NaNm` JWT lifetime throws, and NaN bcrypt rounds are accepted by bcrypt rather than enforcing the configured cost.
- **Verification:** Actual schema `safeParse` accepted `PORT=abc`, `BCRYPT_SALT_ROUNDS=abc`, and `JWT_ACCESS_EXPIRES_IN_MINUTES=abc`, producing NaN. Node's `createServer().listen(NaN)` threw `ERR_SOCKET_BAD_PORT`; JWT signing rejected `NaNm`. `bcrypt.hash(password, NaN)` silently used 10 rounds, confirmed with `getRounds`.
- **Fix:** Validate complete numeric inputs as finite integers with setting-specific ranges, including valid ports, positive lifetimes/TTLs, and supported bcrypt costs. Apply safe defaults only to omitted values, separately from invalid-input handling.

### 13. P3 — Console streams drop configured debug and trace logs

**Location:** `src/configs/logger.ts:13,15,72`.

- **Trigger / impact:** Set `LOG_LEVEL=debug` or `trace`. Console stream entries omit a level and `multistream` defaults to an info threshold, silently discarding lower-level events despite the logger setting.
- **Verification:** The installed Pino implementation emitted only info when debug and info messages were sent through the equivalent default multistream configuration.
- **Fix:** Give console stream entries an explicit `trace` threshold and let the logger's configured level perform filtering; retain the intentional error/fatal thresholds for file streams.
