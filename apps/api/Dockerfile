# ============================================================
# SIS-MALI — API Dockerfile (optimisé pour rebuild rapide)
# ============================================================
# Principe : toutes les couches stables (apk, npm config, package.json,
# npm install, prisma generate) sont AVANT le COPY du code source.
# Ainsi, une modification de code ne réinstalle pas les 897 packages.
# ============================================================

FROM node:20-alpine AS builder
WORKDIR /app

# 1. Build tools (couche stable, invalidée seulement si on les change)
RUN apk add --no-cache openssl

# 2. Config npm (couche stable)
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 900000 && \
    npm config set fetch-retries 5

# 3. Copier UNIQUEMENT les package.json (couche invalidée si package.json change)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/

# 4. npm install (cache préservé si package.json n'a pas changé)
#    → C'est la couche la plus longue (9-10 min), maintenant en cache
RUN npm ci --no-audit --no-fund --prefer-offline

# tsconfig APRÈS npm ci (il ne sert qu'au build, pas à l'install)
COPY tsconfig.base.json ./

# 5. Schéma Prisma + prisma generate (cache préservé si schema.prisma n'a pas changé)
COPY prisma ./prisma
RUN cd apps/api && npx prisma generate --schema=../../prisma/schema.prisma || npx prisma generate

# 6. Code source (invalidé à chaque modif code, mais npm install est déjà fait)
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# 7. Build shared + api (rapide, pas de npm install)
RUN rm -f packages/shared/tsconfig.tsbuildinfo && npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# ============================================================
# Runner
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Chromium + polices + outils runtime
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto openssl dumb-init postgresql-client

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    TZ=Africa/Bamako \
    NODE_ENV=production

# Copier les artefacts du builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared ./packages/shared
RUN mkdir -p /app/node_modules/@sis-mali && \
    ln -sfn /app/packages/shared /app/node_modules/@sis-mali/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/storage/documents /app/storage/uploads /app/storage/backups /app/storage/generated

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/main.js"]
