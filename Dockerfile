# Stage 0: setup base
FROM node:20-alpine AS base

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
FROM base AS bilder

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

RUN pnpm lint && pnpm type:check
# RUN pnpm test

RUN pnpm build

# Stage 3: runner
FROM base

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=bilder /app/dist ./dist

# RUN find ./src -type f -name 'test.*.ts' -delete
# RUN find ./src -type f -name '*.test.ts' -delete

EXPOSE 8080

CMD [ "pnpm", "start" ]