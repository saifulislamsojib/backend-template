# A Robust and scalable backend server template for NodeJS + TypeScript

## With:

- Framework: Express JS

- Database: MongoDB with mongoose

- Tester: Testes with `Vitest`, for api test also use `supertest` and for mongodb used `mongodb-memory-server`

- Linter: Typescript `ESLint Airbnb` style guidelines

- Formatter: `Prettier` Formatter with ESLint

- Dockerize: Dockerize for `production`, `staging` and `development` environments

- `Husky` Git Hooks: Husky pre-commit hook with `lint-staged` for eslint and prettier, pre-push hook for run tests and commit-msg hook for `commit-lint` for checking commit messages

- CI/CD with Github Actions: Github Actions for`Code Checker` (lint-check, type-check & run tests) & `Commit Lint` for checking commit messages

- Path alias: Path alias with `tsconfig-paths`

- HTTP & Application Logger: Pino logger with `pino`, `pino-http` and `pino-pretty`

- Caching with Redis: Caching with `Redis server`

## Instructions for local server running

<ol>
    <li>First ensure to add DB_URI in `env` variable</li>
    <li>Then install necessary dependencies using `pnpm install`</li>
    <li>To run local server use `pnpm dev` command</li>
    <li>To build the project run `pnpm build` command</li>
    <li>To Lint and format the project run `pnpm lint`</li>
</ol>
