# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS builder
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN apk add --no-cache openssl python3 make g++
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 900000 && \
    npm config set fetch-retries 5
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --prefer-offline
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api
RUN cd apps/api && npx prisma generate --schema=../../prisma/schema.prisma || npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto openssl dumb-init postgresql-client
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    TZ=Africa/Bamako \
    NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/storage/documents /app/storage/uploads /app/storage/backups /app/storage/generated
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/main.js"]
