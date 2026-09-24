# ============================================================
# SIS-MALI — Worker Dockerfile (build pre-compiled)
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    openssl

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    TZ=Africa/Bamako

# Copier les dependances deja installees
COPY node_modules ./node_modules
COPY packages/shared ./packages/shared

# Copier le code deja compile
COPY apps/worker/dist ./apps/worker/dist
COPY apps/worker/package.json ./apps/worker/

# Copier prisma
COPY prisma ./prisma

RUN mkdir -p /app/storage/documents /app/storage/backups

CMD ["node", "apps/worker/dist/main.js"]
