# Stage 0: setup base
FROM node:22-alpine AS base

# pnpm setup
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app
USER node

COPY package.json pnpm-lock.yaml ./

# Stage 1: prod-deps
FROM base AS prod-deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Stage 2: build
FROM base AS builder

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

RUN pnpm lint:fix

RUN pnpm build

# Stage 3: runner
FROM base

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD [ "node", "dist/server.js" ]