# ============================================================
# SIS-MALI — API Dockerfile (build pre-compiled)
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
COPY apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/

# Copier prisma
COPY prisma ./prisma

RUN mkdir -p /app/storage/documents /app/storage/uploads /app/storage/backups /app/storage/generated

EXPOSE 3000

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
