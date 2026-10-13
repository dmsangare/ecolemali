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
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker
COPY prisma ./prisma
RUN npm install --no-audit --no-fund --prefer-offline
RUN rm -f packages/shared/tsconfig.tsbuildinfo \
    && npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/worker

FROM node:20-alpine AS runner
WORKDIR /app
# Worker = backup + scheduler uniquement (pas de PDF, pas de Chromium)
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
