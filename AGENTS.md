# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

Express 5 + TypeScript backend template (ESM, Node >= 24.22.3) with MongoDB (Mongoose), Redis caching, JWT auth, Zod validation, Pino logging, and Docker configurations. The repository pins Node 26.13.1 in `.nvmrc` and pnpm 12.21.0 in `package.json`; pnpm is enforced by `preinstall`.

Bun (v1.4.4) is supported as an optional runtime and bundler only. pnpm remains the package manager and Vitest the test runner — do not use Bun for installing dependencies or running tests.

## Commands

- `pnpm dev` — run dev server with tsx watch (loads `.env`)
- `pnpm dev:bun` — run dev server with Bun's watch mode (`bun --watch --no-clear-screen src/server.ts`)
- `pnpm build` — compile with tsc, then resolve path aliases with tsc-alias
- `pnpm build:bun` — bundle with Bun (`bun build src/server.ts --target bun --outdir dist`)
- `pnpm fmt` — format with Bun's built-in formatter (`bun fmt`)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` / `pnpm lint:fix` — ESLint with `--max-warnings 0` (shared `@stack-lint/*` configs)
- `pnpm format` — format source/config files with Prettier
- `pnpm test` — run all tests with Vitest
- `pnpm test:w` — watch mode
- `pnpm coverage` — run Vitest with coverage reporting
- `pnpm docker` / `pnpm docker-stage` — production or staging Docker Compose environments (each includes Redis)
- `pnpm docker:sh`, `pnpm docker-stage:sh` — shell into the matching server container; `pnpm redis-cli` opens the Redis CLI

Tests use an in-memory MongoDB replica set via `mongodb-memory-server` (`src/test/globalSetup.ts`), so no local MongoDB or listening HTTP server is needed. Outside CI, the global setup loads `.env.test`; CI supplies its test environment explicitly. Redis must be reachable whenever code under test uses Redis (CI provides it as a service).

Git hooks (Husky): pre-commit runs lint-staged (ESLint fix, related Vitest tests, and Prettier) and typecheck. The commit-msg hook runs commitlint; Conventional Commit scopes are required.

## Architecture

**Bootstrap flow:** Importing `src/configs/env.ts` validates the environment with Zod and terminates the process if it is invalid. Redis connects independently as an import side effect in `src/configs/redis.ts` (outside the test environment), and cache operations fail soft if it is unavailable. `src/server.ts` awaits the MongoDB connection via `dbConnect()` and starts the HTTP server only after MongoDB is connected. It also handles process shutdown by closing the HTTP server, Redis, and MongoDB connections. `src/app.ts` builds the Express app (middleware + routes) and is imported directly by tests via Supertest — the server never listens during tests.

**Config:** Runtime application code reads environment values only through the frozen `env` object exported by `src/configs/env.ts`; do not read `process.env` outside setup/bootstrap code. To add an environment variable, add it to `envValidationSchema` and add a safe placeholder to `.env.example` when appropriate. The schema parses numeric values such as `PORT`, `REDIS_PORT`, `BCRYPT_SALT_ROUNDS`, and `REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS`. CORS requires a URL in `CLIENT_ORIGIN`. Pino HTTP/application logging writes to the console.

**Module pattern:** Features live in `src/modules/<name>/` with files split by role as needed: `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.validation.ts` (Zod schemas), `*.model.ts` (Mongoose), `*.types.ts`, `*.constant.ts`, `*.utils.ts`, and `*.test.ts`. Controllers call service methods (auth uses the default `authService` export with `registerUser`, `loginUser`, and `changePassword`); services own business rules and repositories own all application database access. New modules are registered in the `moduleRoutes` array in `src/routes/api.routes.ts`, mounted under `/api/v1`.

**Persistence boundary:** Use purpose-specific typed functions in `modules/<name>/<name>.repository.ts`, not classes, DI, or generic base repositories. The User repository serves both auth services and auth middleware. Contracts in `user.types.ts` preserve native Mongoose ObjectId IDs, internal Date values, allowlisted `PublicUser`, separate credentials (`passwordHash`), and auth state. ID lookups accept strings or ObjectIds; HTTP JSON and decoded JWT claims use strings. This deliberate Mongo-specific identifier contract requires adapting types and callers in a future SQL migration. Never return Mongoose documents, queries, write results, or `__v`. Services hash/compare passwords and own token policy; repositories accept already-hashed values. Password changes atomically compare ID + expected hash and return an updated safe user or null. Keep the existing timestamp revocation policy; token versions and same-second revocation are deferred. Repositories may throw raw database errors. At the central HTTP catch boundary, `utils/catchAsync.ts` calls `translateDatabaseError` from `errors/mongooseErrors.ts` to translate known failures to neutral `PersistenceError`; global middleware maps those to the existing API error types. Controllers and auth middleware use this boundary; non-HTTP repository callers receive raw errors. Unknown failures pass through unchanged and remain 500. ESLint restricts model/driver/connection imports to persistence, lifecycle infrastructure, and tests, with a narrow translator-only import exception for `catchAsync` and a type-only Mongoose import in `index.d.ts` for the shared `ObjectId` alias. Mongo lifecycle stays in `configs/db.ts` and `server.ts`; Redis remains separate.

**Module exports:** Controllers and validation modules expose their runtime members through one default object export (for example, `authController`, `healthController`, and `authValidation` at import sites), matching `authService`. Validation payload types remain named type exports.

**Request pipeline conventions:**

- Wrap every handler in `catchAsync` (`src/utils/catchAsync.ts`) — errors propagate to the global error handler, never use try/catch in controllers.
- Feature responses go through `sendResponse` (`src/utils/sendResponse.ts`), which enforces the `{ success, statusCode, message, data/error }` envelope. Error responses carry a `type` from `src/errors/error.const.ts`. The root and health endpoints are deliberately simple direct JSON responses.
- Throw `AppError(statusCode, message)` for expected failures; `src/middleware/globalErrorhandler.ts` maps Zod and Mongoose errors plus `AppError` into the response envelope. JWT verification is normalized to `AppError` in `auth.utils.ts`.
- Route-level middleware: `validateRequest(schema, target?)` for Zod validation (`target` is `'body'` (default), `'params'`, or `'query'`), `authCheck(...roles)` for JWT auth + role authorization (reads token from the `access-token` cookie or `authorization` header; tokens are invalidated when password/email/role changes), and `cacheRoute('public' | 'protected')` for Redis response caching. Use the paired `setRouteCache` and `deleteRouteCache` helpers when managing cached route data.
- Use HTTP status constants from `http-status` (`status.OK` etc.), never numeric literals.

**Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`; `.path-resolver.mjs` supports Node's native watch workflow). Use it for cross-directory imports.

**Global types:** `src/index.d.ts` declares `AnyObject`, `Params`, and `req.user` (set by `authCheck`).

**Testing:** Use the `apiTester` helper (`src/test/apiTester.ts`) for API endpoint tests — it wraps Supertest and asserts status, success, and error type in one call. Import its named `request` client for small direct assertions. Test files live next to their module as `*.test.ts`; Vitest includes `src/**/*.test.ts`.

## TypeScript strictness

tsconfig enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and `erasableSyntaxOnly` (no enums or parameter properties — use `as const` objects like `ERROR_TYPE`/`userRoles`). Use `import type` for type-only imports.
