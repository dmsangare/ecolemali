#!/usr/bin/env bash
# ============================================================
# SIS-MALI — Sauvegarde PostgreSQL + Documents
# ============================================================
# Retention graduee :
#   - 7 jours quotidiens
#   - 4 semaines (chaque dimanche)
#   - 6 mois (chaque 1er du mois)
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"

DATE=$(date +%Y%m%d_%H%M%S)
DOW=$(date +%u)          # 1=lundi ... 7=dimanche
DOM=$(date +%d)          # 01-31
BACKUP_DIR="backups"
LOG_DIR="backups/logs"
mkdir -p "$BACKUP_DIR" "$LOG_DIR"
LOG_FILE="$LOG_DIR/backup_$(date +%Y%m).log"

# --- Log helpers ---
log() {
  local msg="[$(date +'%Y-%m-%d %H:%M:%S')] [BACKUP] $1"
  echo -e "\033[0;32m$msg\033[0m"
  echo "$msg" >> "$LOG_FILE"
}
error() {
  local msg="[$(date +'%Y-%m-%d %H:%M:%S')] [BACKUP-ERROR] $1"
  echo -e "\033[0;31m$msg\033[0m" >&2
  echo "$msg" >> "$LOG_FILE"
  # Envoyer un mail si configuré
  if [ -n "${BACKUP_ALERT_WEBHOOK:-}" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"text\":\"⚠️ SIS-MALI Backup: $1\"}" \
      "$BACKUP_ALERT_WEBHOOK" > /dev/null 2>&1 || true
  fi
}

# --- Charger uniquement les vars necessaires (au lieu de "source .env" fragile) ---
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
PG_PASSWORD="$(read_env_var POSTGRES_PASSWORD '')"

log "===== Demarrage backup ($DATE) ====="

# ============================================================
# 1. Dump PostgreSQL
# ============================================================
DB_FILE="$BACKUP_DIR/db_$DATE.sql.gz"
log "Dump PostgreSQL -> $DB_FILE"

if docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$PG_PASSWORD" postgres \
    pg_dump -U "$PG_USER" "$PG_DB" | gzip > "$DB_FILE"; then

  # Verification integrite gzip
  if gzip -t "$DB_FILE" 2>/dev/null; then
    SIZE=$(du -h "$DB_FILE" | cut -f1)
    log "Dump DB OK ($SIZE) — integrite verifiee"
  else
    error "Dump DB corrompu (gzip -t a echoue)"
    rm -f "$DB_FILE"
    exit 1
  fi
else
  error "Echec du dump PostgreSQL"
  rm -f "$DB_FILE"
  exit 1
fi

# ============================================================
# 2. Archive des documents
# ============================================================
DOC_FILE="$BACKUP_DIR/documents_$DATE.tar.gz"
if [ -d storage/documents ] && [ "$(ls -A storage/documents 2>/dev/null)" ]; then
  log "Archive documents -> $DOC_FILE"
  if tar -czf "$DOC_FILE" storage/documents/ 2>/dev/null; then
    SIZE=$(du -h "$DOC_FILE" | cut -f1)
    log "Archive documents OK ($SIZE)"
  else
    error "Echec archive documents"
    rm -f "$DOC_FILE"
  fi
else
  log "Pas de documents a archiver"
fi

# ============================================================
# 3. Retention graduee
# ============================================================
log "Retention graduee..."

# 3.1 Copie hebdomadaire (chaque dimanche)
if [ "$DOW" = "7" ]; then
  WEEK_FILE="$BACKUP_DIR/weekly/db_week_$(date +%Y-%W).sql.gz"
  mkdir -p "$BACKUP_DIR/weekly"
  cp "$DB_FILE" "$WEEK_FILE" 2>/dev/null && log "Copie hebdo creee"
fi

# 3.2 Copie mensuelle (1er du mois)
if [ "$DOM" = "01" ]; then
  MONTH_FILE="$BACKUP_DIR/monthly/db_month_$(date +%Y-%m).sql.gz"
  mkdir -p "$BACKUP_DIR/monthly"
  cp "$DB_FILE" "$MONTH_FILE" 2>/dev/null && log "Copie mensuelle creee"
fi

# 3.3 Nettoyage quotidiens (>7 jours)
DEL_DAILY=$(find "$BACKUP_DIR" -maxdepth 1 -name "db_*.sql.gz" -mtime +7 -print -delete 2>/dev/null | wc -l)
DEL_DOCS=$(find "$BACKUP_DIR" -maxdepth 1 -name "documents_*.tar.gz" -mtime +7 -print -delete 2>/dev/null | wc -l)
log "Nettoyage : $DEL_DAILY dump(s) quotidien(s), $DEL_DOCS archive(s) supprime(s)"

# 3.4 Nettoyage hebdomadaires (>4 semaines)
find "$BACKUP_DIR/weekly" -name "db_week_*.sql.gz" -mtime +28 -delete 2>/dev/null || true

# 3.5 Nettoyage mensuels (>6 mois)
find "$BACKUP_DIR/monthly" -name "db_month_*.sql.gz" -mtime +180 -delete 2>/dev/null || true

# 3.6 Nettoyage logs (>3 mois)
find "$LOG_DIR" -name "backup_*.log" -mtime +90 -delete 2>/dev/null || true

# ============================================================
# 4. Resume
# ============================================================
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
COUNT_DAILY=$(find "$BACKUP_DIR" -maxdepth 1 -name "db_*.sql.gz" | wc -l)
COUNT_WEEKLY=$(find "$BACKUP_DIR/weekly" -name "*.sql.gz" 2>/dev/null | wc -l)
COUNT_MONTHLY=$(find "$BACKUP_DIR/monthly" -name "*.sql.gz" 2>/dev/null | wc -l)

log "===== Backup termine ====="
log "Quotidiens : $COUNT_DAILY | Hebdo : $COUNT_WEEKLY | Mensuels : $COUNT_MONTHLY"
log "Espace total utilise : $TOTAL_SIZE"
log ""

exit 0
