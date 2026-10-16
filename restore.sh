#!/usr/bin/env bash
# ============================================================
# SIS-MALI — Restauration PostgreSQL
# ============================================================
# Usage : ./restore.sh backups/db_20261016_230000.sql.gz
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[RESTORE]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Args ---
if [ $# -ne 1 ]; then
  echo "Usage : $0 <fichier_backup.sql.gz>"
  echo ""
  echo "Backups disponibles :"
  ls -lh backups/db_*.sql.gz 2>/dev/null | tail -10 || echo "(aucun)"
  echo ""
  echo "Backups hebdomadaires :"
  ls -lh backups/weekly/*.sql.gz 2>/dev/null | tail -5 || echo "(aucun)"
  echo ""
  echo "Backups mensuels :"
  ls -lh backups/monthly/*.sql.gz 2>/dev/null | tail -5 || echo "(aucun)"
  exit 1
fi

DUMP_FILE="$1"

if [ ! -f "$DUMP_FILE" ]; then
  error "Fichier introuvable : $DUMP_FILE"
fi

if ! gzip -t "$DUMP_FILE" 2>/dev/null; then
  error "Fichier corrompu (gzip -t echoue)"
fi

# --- Charger uniquement les vars necessaires ---
read_env_var() {
  local key="$1"
  local default="$2"
  if [ -f .env ]; then
    local val
    val=$(grep -E "^${key}=" .env | head -1 | cut -d'=' -f2- | sed 's/^"//; s/"$//' | sed "s/^'//; s/'$//")
    echo "${val:-$default}"
  else
    echo "$default"
  fi
}

PG_USER="$(read_env_var POSTGRES_USER sis_user)"
PG_DB="$(read_env_var POSTGRES_DB sis_mali)"

# --- Confirmation obligatoire ---
echo ""
echo -e "${YELLOW}============================================================${NC}"
echo -e "${YELLOW} ATTENTION — OPERATION DESTRUCTIVE${NC}"
echo -e "${YELLOW}============================================================${NC}"
echo ""
echo "Base cible  : $PG_DB"
echo "Utilisateur : $PG_USER"
echo "Fichier     : $DUMP_FILE"
echo ""
echo "Toutes les donnees actuelles seront ECRASEES."
echo ""
read -p "Tape 'CONFIRMER' pour continuer : " CONFIRM

if [ "$CONFIRM" != "CONFIRMER" ]; then
  error "Annule par l'utilisateur"
fi

# --- Backup de securite avant ecrasement ---
SAFETY_FILE="backups/db_PRE_RESTORE_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Backup de securite -> $SAFETY_FILE"
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$PG_USER" "$PG_DB" | gzip > "$SAFETY_FILE"
log "Backup de securite OK"

# --- Restauration ---
log "Arret des services applicatifs (api, worker)..."
docker compose -f docker-compose.prod.yml stop api worker 2>/dev/null || true

log "Suppression des connexions actives..."
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$PG_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$PG_DB' AND pid <> pg_backend_pid();" >/dev/null || true

log "Drop + recreate base..."
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS $PG_DB;" >/dev/null
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$PG_USER" -d postgres -c "CREATE DATABASE $PG_DB OWNER $PG_USER;" >/dev/null

log "Restauration depuis $DUMP_FILE..."
gunzip -c "$DUMP_FILE" | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$PG_USER" -d "$PG_DB" >/dev/null

log "Redemarrage des services..."
docker compose -f docker-compose.prod.yml up -d api worker

log ""
log "✅ Restauration terminee avec succes"
log "   Backup de securite : $SAFETY_FILE"
log ""
log "Verification :"
log "  docker compose -f docker-compose.prod.yml exec -T postgres psql -U $PG_USER -d $PG_DB -c '\\dt' | head -20"
log ""
