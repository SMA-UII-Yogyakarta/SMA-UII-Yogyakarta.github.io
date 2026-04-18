FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN git submodule update --init --recursive 2>/dev/null || true

# Secrets di-inject via build args, ditulis ke .env.production
# agar Astro membacanya saat build sebagai import.meta.env
ARG TURSO_URL
ARG TURSO_TOKEN
ARG OAUTH_GITHUB_CLIENT_ID
ARG OAUTH_GITHUB_CLIENT_SECRET
ARG SLIMS_API_URL
ARG SLIMS_API_KEY
ARG PUBLIC_SITE_URL=https://lab.smauiiyk.sch.id

RUN printf "TURSO_URL=%s\nTURSO_TOKEN=%s\nOAUTH_GITHUB_CLIENT_ID=%s\nOAUTH_GITHUB_CLIENT_SECRET=%s\nSLIMS_API_URL=%s\nSLIMS_API_KEY=%s\nPUBLIC_SITE_URL=%s\n" \
    "$TURSO_URL" "$TURSO_TOKEN" "$OAUTH_GITHUB_CLIENT_ID" "$OAUTH_GITHUB_CLIENT_SECRET" \
    "$SLIMS_API_URL" "$SLIMS_API_KEY" "$PUBLIC_SITE_URL" > .env.production

RUN bun run build

# Hapus secrets dari image final — tidak perlu di runtime
FROM oven/bun:1.3-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production
CMD ["bun", "dist/server/entry.mjs"]
