# ============================================================
# SIS-MALI — Worker Dockerfile (optimisé pour rebuild rapide)
# Worker = backup + scheduler + notifications (PAS de PDF)
# ============================================================

FROM node:20-alpine AS builder
WORKDIR /app

# 1. Build tools (couche stable)
RUN apk add --no-cache openssl

# 2. Config npm (couche stable)
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 900000 && \
    npm config set fetch-retries 5

# 3. Package.json uniquement (couche invalidée si package.json change)
COPY package.json package-lock.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/
COPY tsconfig.base.json ./

# 4. npm ci (cache préservé si package.json n'a pas changé)
RUN npm ci --no-audit --no-fund --prefer-offline

# 5. Schéma Prisma + prisma generate (cache préservé si schema.prisma n'a pas changé)
COPY prisma ./prisma
RUN npx prisma generate

# 6. Code source (invalidé à chaque modif code, mais npm ci est déjà fait)
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

# 7. Build shared + worker
RUN rm -f packages/shared/tsconfig.tsbuildinfo && npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/worker

# ============================================================
# Runner
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Worker = pas de Chromium, pas de PDF
RUN apk add --no-cache openssl dumb-init postgresql-client

ENV TZ=Africa/Bamako \
    NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/storage/backups

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/worker/dist/main.js"]
