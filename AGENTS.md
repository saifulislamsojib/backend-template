# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

Express 5 + TypeScript backend template (ESM, Node >= 24) with MongoDB (Mongoose), Redis caching, JWT auth, Zod validation, Pino logging, and Docker configurations. The repository pins Node 24 in `.nvmrc` and pnpm 11.9.0 in `package.json`; pnpm is enforced by `preinstall`.

## Commands

- `pnpm dev` — run dev server with tsx watch (loads `.env`)
- `pnpm build` — compile with tsc, then resolve path aliases with tsc-alias
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` / `pnpm lint:fix` — ESLint with `--max-warnings 0` (shared `@stack-lint/*` configs)
- `pnpm format` — format supported source/config files with Prettier
- `pnpm test` — run all tests with Vitest
- `pnpm test:w` — watch mode
- `pnpm coverage` — run Vitest with coverage reporting
- `pnpm docker` / `pnpm docker-stage` / `pnpm docker-dev` — production, staging, or development Docker Compose environments (each includes Redis)
- `pnpm docker:sh`, `pnpm docker-stage:sh`, `pnpm docker-dev:sh` — shell into the matching server container; `pnpm redis-cli` opens the Redis CLI

Tests use an in-memory MongoDB replica set via `mongodb-memory-server` (`src/test/globalSetup.ts`), so no local MongoDB or listening HTTP server is needed. Outside CI, the global setup loads `.env.test`; CI supplies its test environment explicitly. Redis must be reachable whenever code under test uses Redis (CI provides it as a service).

Git hooks (Husky): pre-commit runs lint-staged (ESLint fix, related Vitest tests, and Prettier) and typecheck. The commit-msg hook runs commitlint; Conventional Commit scopes are required.

## Architecture

**Bootstrap flow:** `src/server.ts` validates env vars (Zod schema in `src/utils/catchEnvValidation.ts`), connects Redis and MongoDB in parallel, and only then starts the HTTP server. It also handles process shutdown by closing the HTTP server, Redis, and MongoDB connections. `src/app.ts` builds the Express app (middleware + routes) and is imported directly by tests via Supertest — the server never listens during tests.

**Config:** Runtime application code reads environment values through the frozen `configs` object in `src/configs/index.ts`. To add an env var: add it to the Zod schema in `catchEnvValidation.ts` (which also drives the global `ProcessEnv` type), expose it via `configs`, and add a safe placeholder to `.env.example` when appropriate. `PORT`, Redis host/port, logging, CORS origin, JWT, bcrypt, and cache TTL are configured there.

**Module pattern:** Features live in `src/modules/<name>/` with files split by role as needed: `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.validation.ts` (Zod schemas), `*.model.ts` (Mongoose), `*.types.ts`, `*.constant.ts`, `*.utils.ts`, and `*.test.ts`. Controllers call `*ToDb`/`*FromDb` service functions; services hold DB logic. New modules are registered in the `moduleRoutes` array in `src/routes/api.routes.ts`, mounted under `/api/v1`.

**Request pipeline conventions:**

- Wrap every handler in `catchAsync` (`src/utils/catchAsync.ts`) — errors propagate to the global error handler, never use try/catch in controllers.
- Feature responses go through `sendResponse` (`src/utils/sendResponse.ts`), which enforces the `{ success, statusCode, message, data/error }` envelope. Error responses carry a `type` from `src/errors/error.const.ts`. The root and health endpoints are deliberately simple direct JSON responses.
- Throw `AppError(statusCode, message)` for expected failures; `src/middleware/globalErrorhandler.ts` maps Zod and Mongoose errors plus `AppError` into the response envelope. JWT verification is normalized to `AppError` in `auth.utils.ts`.
- Route-level middleware: `validateRequest(schema)` for Zod validation, `authCheck(...roles)` for JWT auth + role authorization (reads token from the `access-token` cookie or `authorization` header; tokens are invalidated when password/email/role changes), and `cacheRoute('public' | 'protected')` for Redis response caching. Use the paired `setRouteCache` and `deleteRouteCache` helpers when managing cached route data.
- Use HTTP status constants from `http-status` (`status.OK` etc.), never numeric literals.

**Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`; `.path-resolver.mjs` supports Node's native watch workflow). Use it for cross-directory imports.

**Global types:** `src/types/index.d.ts` declares `AnyObject`, `Params`, typed `process.env`, and `req.user` (set by `authCheck`).

**Testing:** Use the `apiTester` helper (`src/test/apiTester.ts`) for API endpoint tests — it wraps Supertest and asserts status, success, and error type in one call. Import its named `request` client for small direct assertions. Test files live next to their module as `*.test.ts`; Vitest includes `src/**/*.test.ts`.

## TypeScript strictness

tsconfig enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and `erasableSyntaxOnly` (no enums or parameter properties — use `as const` objects like `ERROR_TYPE`/`userRoles`). Use `import type` for type-only imports.
