FROM node:20-alpine AS builder
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 900000 && \
    npm config set fetch-retries 5
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm install --no-audit --no-fund --prefer-offline
RUN rm -f packages/shared/tsconfig.tsbuildinfo \
    && npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/web

FROM nginx:1.25-alpine AS runner
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
