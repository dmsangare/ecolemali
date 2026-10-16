#!/usr/bin/env bash
# ============================================================
# SIS-MALI — Installation du cron de backup automatique
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

if [ "$EUID" -eq 0 ]; then
  echo "Ne pas lancer en root — le script installe le cron pour l'utilisateur courant."
  exit 1
fi

# Heure de backup (configurable)
BACKUP_HOUR="${BACKUP_HOUR:-23}"
BACKUP_MINUTE="${BACKUP_MINUTE:-00}"

# Ligne cron
CRON_LINE="$BACKUP_MINUTE $BACKUP_HOUR * * * cd $PROJECT_DIR && ./backup.sh >> $PROJECT_DIR/backups/logs/cron.log 2>&1"

# Verifier si deja installe
if crontab -l 2>/dev/null | grep -qF "$PROJECT_DIR/backup.sh"; then
  echo "Cron deja installe pour ce projet."
  echo ""
  echo "Cron actuel :"
  crontab -l 2>/dev/null | grep "backup.sh"
  echo ""
  read -p "Remplacer ? (o/N) : " REPLACE
  if [ "$REPLACE" != "o" ] && [ "$REPLACE" != "O" ]; then
    echo "Annule."
    exit 0
  fi
  # Supprimer l'ancienne ligne
  crontab -l 2>/dev/null | grep -vF "$PROJECT_DIR/backup.sh" | crontab -
fi

# Ajouter la nouvelle ligne
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo "✅ Cron installe : backup quotidien a ${BACKUP_HOUR}h${BACKUP_MINUTE}"
echo ""
echo "Verification : crontab -l"
echo "Logs        : tail -f $PROJECT_DIR/backups/logs/cron.log"
echo ""
