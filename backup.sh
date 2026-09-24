#!/usr/bin/env bash
# ============================================================
# SIS-MALI — Sauvegarde (DB + documents)
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

log() { echo -e "\033[0;32m[BACKUP]\033[0m $1"; }

log "Sauvegarde PostgreSQL…"
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-sis_user}" "${POSTGRES_DB:-sis_mali}" \
  | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

log "Sauvegarde des documents…"
tar -czf "$BACKUP_DIR/documents_$DATE.tar.gz" storage/documents/ 2>/dev/null || true

log "Nettoyage (rétention 30 jours)…"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

log "✅ Sauvegarde terminée : $BACKUP_DIR/*_$DATE*"
