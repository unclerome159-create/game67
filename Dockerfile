# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Хроноакадемия — production image
#
# Build:  docker build -t chronoacademy .
# Run:    docker run --rm -p 3000:3000 --env-file .env chronoacademy
# ---------------------------------------------------------------------------

# ---- Stage 1: install every dependency and build the Vite bundle ----------
FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---- Stage 2: production dependencies only --------------------------------
FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- Stage 3: minimal runtime --------------------------------------------
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# server.ts runs directly under Bun (native TypeScript support), so no
# transpile step is needed — only the built client bundle and runtime deps.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json bun.lock server.ts ./
COPY --from=build /app/dist ./dist

RUN chown -R bun:bun /app
USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["sh", "-c", "wget -qO- \"http://127.0.0.1:${PORT}/\" > /dev/null 2>&1 || exit 1"]

CMD ["bun", "server.ts"]
