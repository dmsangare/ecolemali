# ============================================================
# SIS-MALI — Frontend Web Dockerfile (React + Vite)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm install
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=apps/web

# ------------------------------------------------------------
FROM nginx:1.25-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
