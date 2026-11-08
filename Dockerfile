# ==========================================
# SpeakLife AI — Production Dockerfile
# Multi-stage build with better-sqlite3 native support
# ==========================================

# Stage 1: Install dependencies & build native C++ addons
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ gcc
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

# Create non-root system user for OWASP security compliance
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create data directory for SQLite database persistence
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy built application and runtime dependencies
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 10000
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-10000}/healthz || exit 1

CMD ["npm", "start"]
