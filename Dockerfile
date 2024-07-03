FROM node:20-alpine AS base

# Stage 1
FROM base AS bilder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app
USER node

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# COPY .env ./.env
COPY tsconfig.json ./tsconfig.json
COPY src/ ./src/

RUN pnpm build


# Stage 2
FROM base AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app
USER node

COPY --from=bilder /app/package.json /app/pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=bilder /app/dist ./dist
# COPY --from=bilder /app/.env ./.env

EXPOSE 8080

CMD [ "pnpm", "start" ]