FROM node:24.22.3-alpine AS base

# Stage 1: deps-installer
FROM base AS deps-installer

# pnpm setup
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Stage 2: prod-deps
FROM deps-installer AS prod-deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# Stage 3: builder
FROM deps-installer AS builder

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm build

# Stage 4: runner
FROM base

WORKDIR /app

COPY --from=deps-installer --chown=node:node /app/package.json ./package.json
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

CMD [ "node", "dist/server.js" ]