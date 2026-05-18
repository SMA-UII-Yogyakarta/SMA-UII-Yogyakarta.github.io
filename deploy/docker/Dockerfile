FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git

# Layer 1: Dependencies (cache selama package.json & bun.lock tidak berubah)
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/validation/package.json packages/validation/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# Layer 2: Source code
COPY . .
RUN git submodule update --init --recursive 2>/dev/null || true

# Layer 3: Build-time secrets (inject via --build-arg, ditulis ke .env.production)
ARG TURSO_URL
ARG TURSO_TOKEN
ARG OAUTH_GITHUB_CLIENT_ID
ARG OAUTH_GITHUB_CLIENT_SECRET
ARG SLIMS_API_URL
ARG SLIMS_API_KEY
ARG PUBLIC_SITE_URL=https://lab.smauiiyk.sch.id

RUN printf "TURSO_URL=%s\nTURSO_TOKEN=%s\nOAUTH_GITHUB_CLIENT_ID=%s\nOAUTH_GITHUB_CLIENT_SECRET=%s\nSLIMS_API_URL=%s\nSLIMS_API_KEY=%s\nPUBLIC_SITE_URL=%s\n" \
    "$TURSO_URL" "$TURSO_TOKEN" "$OAUTH_GITHUB_CLIENT_ID" "$OAUTH_GITHUB_CLIENT_SECRET" \
    "$SLIMS_API_URL" "$SLIMS_API_KEY" "$PUBLIC_SITE_URL" > apps/web/.env.production

RUN bun run build

# Stage 2: Production runtime (minimal)
FROM oven/bun:1.3-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production
CMD ["bun", "dist/server/entry.mjs"]
