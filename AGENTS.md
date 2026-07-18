# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

Express 5 + TypeScript backend template (ESM, Node >= 24) with MongoDB (Mongoose), Redis caching, JWT auth, Zod validation, and Pino logging. Package manager is pnpm (enforced via `preinstall`).

## Commands

- `pnpm dev` — run dev server with tsx watch (loads `.env`)
- `pnpm build` — compile with tsc, then resolve path aliases with tsc-alias
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` / `pnpm lint:fix` — ESLint with `--max-warnings 0` (shared `@stack-lint/*` configs)
- `pnpm test` — run all tests with Vitest
- `pnpm test:w` — watch mode
- `pnpm docker-dev` — dev environment via docker compose (includes Redis); `pnpm redis-cli` for Redis shell

Tests load `.env.test` (not `.env`) and spin up an in-memory MongoDB replica set via `mongodb-memory-server` (`src/test/globalSetup.ts`); no local MongoDB or running server is needed. Redis must be reachable for routes using caching.

Git hooks (Husky): pre-commit runs lint-staged (ESLint fix + `vitest related` on staged files) and typecheck; commit messages must follow Conventional Commits (commitlint).

## Architecture

**Bootstrap flow:** `src/server.ts` validates env vars (Zod schema in `src/utils/catchEnvValidation.ts`), connects Redis and MongoDB in parallel, and only then starts the HTTP server. `src/app.ts` builds the Express app (middleware + routes) and is imported directly by tests via supertest — the server never listens during tests.

**Config:** All env access goes through the frozen `configs` object in `src/configs/index.ts`. To add an env var: add it to the Zod schema in `catchEnvValidation.ts` (which also drives the global `ProcessEnv` type) and expose it via `configs`.

**Module pattern:** Features live in `src/modules/<name>/` with files split by role: `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.validation.ts` (Zod schemas), `*.model.ts` (Mongoose), `*.types.ts`, `*.constant.ts`, `*.test.ts`. Controllers call `*ToDb`/`*FromDb` service functions; services hold all DB logic. New modules are registered in the `moduleRoutes` array in `src/routes/api.routes.ts` (mounted under `/api/v1`).

**Request pipeline conventions:**

- Wrap every handler in `catchAsync` (`src/utils/catchAsync.ts`) — errors propagate to the global error handler, never use try/catch in controllers.
- All responses go through `sendResponse` (`src/utils/sendResponse.ts`), which enforces the `{ success, statusCode, message, data/error }` envelope. Error responses carry a `type` from `src/errors/error.const.ts`.
- Throw `AppError(statusCode, message)` for expected failures; `src/middleware/globalErrorhandler.ts` maps Zod, Mongoose (cast/duplicate), JWT, and AppError into the response envelope.
- Route-level middleware: `validateRequest(schema)` for Zod body validation, `authCheck(...roles)` for JWT auth + role authorization (reads token from cookie or `authorization` header; tokens are invalidated when password/email/role changes), `cacheRoute('public' | 'protected')` for Redis response caching (services call `setRouteCache`/`deleteRouteCache`).
- Use HTTP status constants from `http-status` (`status.OK` etc.), never numeric literals.

**Path alias:** `@/*` maps to `src/*` (configured in tsconfig, and `.path-resolver.mjs`). Use it for all cross-directory imports.

**Global types:** `src/types/index.d.ts` declares `AnyObject`, `Params`, typed `process.env`, and `req.user` (set by `authCheck`).

**Testing:** Use the `apiTester` helper (`src/test/apiTester.ts`) for endpoint tests — it wraps supertest and asserts status/success/error-type in one call. Test files live next to their module as `*.test.ts`.

## TypeScript strictness

tsconfig enables `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and `erasableSyntaxOnly` (no enums/parameter properties — use `as const` objects like `ERROR_TYPE`/`userRoles`). Use `import type` for type-only imports.
