# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"
ARG ROOMIO_DB_PROVIDER=sqlite
ENV ROOMIO_DB_PROVIDER=${ROOMIO_DB_PROVIDER}
ENV DATABASE_URL="file:/data/roomio.db"
ARG GITHUB_SHA
ENV GITHUB_SHA=${GITHUB_SHA}
RUN if [ "$ROOMIO_DB_PROVIDER" = "postgresql" ]; then npm run db:generate:pg; else npm run db:generate; fi && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME=0.0.0.0
ARG GITHUB_SHA
ENV GITHUB_SHA=${GITHUB_SHA}
ENV DATABASE_URL="file:/data/roomio.db"

RUN apk add --no-cache wget openssl libc6-compat
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts/docker-entrypoint.mjs ./scripts/docker-entrypoint.mjs
COPY --from=builder /app/scripts/patch-release-git-sha.mjs ./scripts/patch-release-git-sha.mjs
COPY --from=builder /app/scripts/prisma-schema.mjs ./scripts/prisma-schema.mjs

RUN mkdir -p /data && chown -R nextjs:nodejs /data /app
USER nextjs
EXPOSE 3100
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/api/health || exit 1

CMD ["node", "scripts/docker-entrypoint.mjs"]
