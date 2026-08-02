# Backend Template

A production-oriented Express 5 API starter written in TypeScript. It provides MongoDB persistence, Redis-backed infrastructure, JWT authentication, Zod request validation, structured logging, Docker environments, and a tested API foundation.

## Included

- Express 5, TypeScript (ESM), and Node.js 24+
- MongoDB with Mongoose
- Redis for route caching and distributed rate limiting
- JWT authentication with bcrypt password hashing and HTTP-only cookies
- Zod validation and a consistent API error model
- Pino HTTP/application logging, with optional file logs
- Security middleware: Helmet, CORS, request size limits, and trust-proxy support
- Vitest, Supertest, and an in-memory MongoDB replica set for tests
- ESLint, Prettier, Husky, lint-staged, Commitlint, and GitHub Actions
- Production, staging, and development Docker Compose configurations

## Requirements

- Node.js 24 or later (see [`.nvmrc`](.nvmrc))
- pnpm 11 or later
- A MongoDB instance
- Redis for local development and Docker deployments

## Quick start

```bash
git clone <repository-url>
cd backend-template
cp .env.example .env
pnpm install
pnpm dev
```

Before starting the server, replace the placeholder values in `.env`, particularly `DB_URI`, `APP_KEY`, and `JWT_ACCESS_SECRET`. The API listens on `http://localhost:8080` by default.

To start Redis with Docker while running the application locally:

```bash
docker run --name backend-template-redis -p 6379:6379 redis:8.10.0-alpine
```

## Configuration

Application configuration is validated at startup. The following environment variables are supported:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | One of `development`, `test`, `staging`, or `production`. |
| `PORT` | No | `8080` | HTTP server port. |
| `DB_URI` | Yes | — | MongoDB connection URI. |
| `REDIS_HOST` | No | `localhost` | Redis host. |
| `REDIS_PORT` | No | `6379` | Redis port. |
| `REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS` | No | `86400` | TTL for route-cache entries. |
| `APP_KEY` | Yes | — | Secret app key (at least 8 characters) for trusted API clients. |
| `JWT_ACCESS_SECRET` | Yes | — | JWT signing secret (at least 10 characters). |
| `JWT_ACCESS_EXPIRES_IN_MINUTES` | No | `10080` | Access-token lifetime in minutes (7 days). |
| `BCRYPT_SALT_ROUNDS` | Yes | — | bcrypt work factor, such as `10`. |
| `CLIENT_ORIGIN` | Yes | — | Allowed CORS origin, for example `http://localhost:3000`. |
| `LOG_LEVEL` | No | `info` | Pino level: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, or `silent`. |
| `IS_LOGS_ON_FILE` | No | `false` | Set to `true` to write error and fatal logs under `logs/`. |

Example local configuration:

```env
NODE_ENV=development
PORT=8080
DB_URI=mongodb://127.0.0.1:27017/backend-template
REDIS_HOST=localhost
REDIS_PORT=6379
APP_KEY=replace-with-a-long-random-app-key
JWT_ACCESS_SECRET=replace-with-a-long-random-jwt-secret
JWT_ACCESS_EXPIRES_IN_MINUTES=10080
BCRYPT_SALT_ROUNDS=10
CLIENT_ORIGIN=http://localhost:3000
LOG_LEVEL=info
IS_LOGS_ON_FILE=false
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the TypeScript server with watch mode. |
| `pnpm dev:node` | Start Node's native watch mode with path-alias support. |
| `pnpm build` | Compile TypeScript and resolve path aliases into `dist/`. |
| `pnpm start` | Run the compiled application using `.env`. |
| `pnpm typecheck` | Run TypeScript without emitting files. |
| `pnpm lint` / `pnpm lint:fix` | Check code with ESLint, optionally fixing issues. |
| `pnpm format` | Format supported files with Prettier. |
| `pnpm test` / `pnpm test:w` | Run tests once or in watch mode. |
| `pnpm coverage` | Run tests with coverage reporting. |
| `pnpm docker` | Start the production Compose stack in the background. |
| `pnpm docker-stage` | Start the staging Compose stack in the background. |
| `pnpm docker-dev` | Start the development Compose stack. |
| `pnpm docker:sh`, `pnpm docker-stage:sh`, `pnpm docker-dev:sh` | Open a shell in the corresponding application container. |
| `pnpm redis-cli` | Open Redis CLI in the production Compose Redis container. |

## API

The API is mounted at `/api/v1`.

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | Service name and version. |
| `GET` | `/api/v1/health` | No | Health status and version. |
| `POST` | `/api/v1/auth/register` | No | Create a user and start a session. |
| `POST` | `/api/v1/auth/login` | No | Authenticate an existing user. |
| `GET` | `/api/v1/auth/me` | Required | Return the authenticated user. |
| `POST` | `/api/v1/auth/change-password` | Required | Change password and issue a new session token. |

### Authentication

Browser clients receive an `access-token` HTTP-only cookie after registration, login, and password changes. Send that cookie with subsequent requests.

Trusted API clients can include the `x-app-key` header with the configured `APP_KEY`. Auth responses then also include a token in `data.token`; use it as a bearer token:

```http
Authorization: Bearer <token>
x-app-key: <APP_KEY>
```

All current user roles (`user`, `admin`, and `super-admin`) may access the authenticated routes.

### Request bodies

`POST /api/v1/auth/register`

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "SecurePass1!"
}
```

`POST /api/v1/auth/login`

```json
{
  "email": "ada@example.com",
  "password": "SecurePass1!"
}
```

`POST /api/v1/auth/change-password`

```json
{
  "currentPassword": "SecurePass1!",
  "newPassword": "AnotherPass2!"
}
```

Passwords must contain at least eight characters, an uppercase letter, a lowercase letter, a digit, and a special character.

### Response envelope

Successful API responses use this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable summary",
  "data": {}
}
```

Errors use a stable `type` field. In development, errors may also include a stack trace.

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid token!",
  "type": "unauthorized"
}
```

Validation errors use `validationError`; authorization failures use `unauthorized` (401) or `forbidden` (403). Unmatched routes return `notFound` (404).

Registration and login are rate-limited to five attempts per ten minutes. Other routes can opt into the included Redis cache and rate-limit helpers.

## Testing

Tests run against an in-memory MongoDB replica set and do not start an HTTP listener. Outside CI, the test setup loads `.env.test` if present; it must provide the required application settings except `DB_URI`, which is supplied automatically. Redis must be reachable for tests that exercise Redis-backed behavior.

```bash
pnpm test
pnpm coverage
```

## Docker

Each Compose configuration starts the API alongside Redis; you still provide a reachable MongoDB through `DB_URI` in `.env`.

```bash
# Production: http://localhost:8080
pnpm docker

# Staging: http://localhost:8081
pnpm docker-stage

# Development with bind-mounted source and watch mode: http://localhost:8080
pnpm docker-dev
```

The production and staging images build the application in a multi-stage Node 24 Alpine image and run as the non-root `node` user.

## Project structure

```text
src/
├── configs/       # environment, database, Redis, and logging
├── errors/        # application error class and error types
├── middleware/    # authentication, validation, caching, rate limits, uploads
├── modules/       # feature modules (auth, health, user)
├── routes/        # root and versioned API route registration
├── test/          # Vitest setup and Supertest helpers
├── utils/         # response, async-handler, Redis, and server utilities
├── app.ts         # Express application composition
└── server.ts      # infrastructure startup and graceful shutdown
```

## Quality automation

Husky runs lint-staged and type checking before commits, and Commitlint enforces Conventional Commit messages. GitHub Actions runs linting, type checking, tests, commit validation, and release-please workflows.
