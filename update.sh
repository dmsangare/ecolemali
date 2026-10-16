#!/usr/bin/env bash
# ============================================================
# SIS-MALI — Mise à jour production
# ============================================================
set -euo pipefail

log() { echo -e "\033[0;32m[UPDATE]\033[0m $1"; }

cd "$(dirname "$0")"

log "Pull des dernières modifications…"
git stash push -m "auto-stash-avant-update" 2>/dev/null || true
git pull --rebase origin main
git stash pop 2>/dev/null || true

log "Build des images…"
docker compose -f docker-compose.prod.yml build

log "Migrations Prisma…"
docker compose -f docker-compose.prod.yml up -d postgres
sleep 10
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

log "Seed (roles, permissions, categories par defaut)…"
docker compose -f docker-compose.prod.yml exec -T api npm run prisma:seed || {
  echo -e "\033[1;33m[WARN]\033[0m Echec du seed — l'app peut avoir des donnees systeme manquantes"
}

log "Redémarrage des services…"
docker compose -f docker-compose.prod.yml up -d

log "✅ Mise à jour terminée"
