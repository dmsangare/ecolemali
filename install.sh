#!/usr/bin/env bash
# ============================================================
# SIS-MALI — Installation sur Ubuntu LTS (22.04 / 24.04)
# ============================================================
# Usage :
#   git clone git@github.com:dmsangare/ecolemali.git
#   cd ecolemali
#   cp .env.example .env
#   nano .env  # remplir les vraies valeurs
#   sudo ./install.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[INSTALL]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================================
# 0. VÉRIFICATIONS PRÉALABLES
# ============================================================
log "Vérification de l'environnement…"

[[ $EUID -eq 0 ]] || error "Ce script doit être lancé avec sudo."

if [[ ! -f /etc/os-release ]]; then
  error "Système non supporté (pas de /etc/os-release)"
fi

. /etc/os-release
log "OS détecté : $PRETTY_NAME"

if [[ "$ID" != "ubuntu" ]]; then
  warn "Système non Ubuntu ($ID). Le script peut échouer."
fi

if [[ ! -f .env ]]; then
  error ".env absent. Fais 'cp .env.example .env' puis édite-le."
fi

# Vérifier que les secrets sont changés
if grep -q "CHANGE_ME" .env; then
  error "Le .env contient encore des 'CHANGE_ME'. Édite-le avant de relancer."
fi

log "Environnement OK."

# ============================================================
# 1. INSTALLER DOCKER (si absent)
# ============================================================
if ! command -v docker &>/dev/null; then
  log "Installation de Docker…"
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg lsb-release

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  systemctl enable --now docker
  log "Docker installé : $(docker --version)"
else
  log "Docker déjà installé : $(docker --version)"
fi

# ============================================================
# 2. VÉRIFIER DOCKER COMPOSE
# ============================================================
if ! docker compose version &>/dev/null; then
  error "Docker Compose plugin absent. Réinstalle Docker."
fi
log "Docker Compose : $(docker compose version --short)"

# ============================================================
# 3. CRÉER LES DOSSIERS NÉCESSAIRES
# ============================================================
log "Création des dossiers…"
mkdir -p storage/{documents,uploads,backups,generated}
mkdir -p backups/postgres
mkdir -p infra/nginx/certs
chmod -R 755 storage
log "Dossiers OK."

# ============================================================
# 4. BUILD DES IMAGES
# ============================================================
log "Build des images Docker (peut prendre 10-15 min)…"
docker compose -f docker-compose.prod.yml build

# ============================================================
# 5. DÉMARRER LES SERVICES
# ============================================================
log "Démarrage des services…"
docker compose -f docker-compose.prod.yml up -d

log "Attente de PostgreSQL (30s)…"
sleep 30

# ============================================================
# 6. MIGRATIONS PRISMA + SEED VIERGE (premiere installation)
# ============================================================
if [ -f .installed ]; then
  # Installation deja faite → juste appliquer les nouvelles migrations
  log "Mise a jour des migrations (installation existante)…"
  docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy || {
    warn "Echec des migrations — verifie les logs : docker compose -f docker-compose.prod.yml logs api"
    exit 1
  }
else
  # Premiere installation → BDD vierge + seed (Super Admin uniquement)
  log "Premiere installation detectee → initialisation BDD vierge…"
  docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate reset --force --skip-seed || {
    warn "Echec du reset — verifie les logs : docker compose -f docker-compose.prod.yml logs api"
    exit 1
  }
  log "Application du seed vierge (roles + permissions + Super Admin)…"
  docker compose -f docker-compose.prod.yml exec -T api npm run prisma:seed || {
    warn "Echec du seed — verifie les logs : docker compose -f docker-compose.prod.yml logs api"
    exit 1
  }
  touch .installed
  log "Marqueur .installed cree (prochaine execution = update)"
fi

# ============================================================
# 7. SEED — deja effectue ci-dessus (section 6)
# ============================================================
# Le seed est desormais automatique et ne cree QUE le Super Admin.

# ============================================================
# 8. HEALTHCHECK FINAL
# ============================================================
log "Attente finale API (15s)…"
sleep 15

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{}' || echo "000")

if [[ "$API_CODE" == "400" || "$API_CODE" == "401" || "$API_CODE" == "200" ]]; then
  log "API répond (HTTP $API_CODE) ✅"
else
  warn "API ne répond pas correctement (HTTP $API_CODE)"
  warn "Logs : docker compose -f docker-compose.prod.yml logs api --tail=50"
fi

# ============================================================
# 9. RÉSUMÉ
# ============================================================
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "============================================================"
echo -e "${GREEN}✅ SIS-MALI INSTALLÉ${NC}"
echo "============================================================"
echo ""
echo "URL         : http://$IP"
echo "API         : http://$IP/api/v1"
echo "Swagger     : http://$IP/api/docs"
echo ""
echo "Comptes par défaut :"
echo "  admin@sis-mali.local       SUPER_ADMIN"
echo "  director@sis-mali.local    DIRECTOR"
echo "  accountant@sis-mali.local  ACCOUNTANT"
echo ""
echo "  Le mot de passe a ete affiche ci-dessus pendant le seed."
echo "  Il doit etre change a la premiere connexion."
echo ""
echo "  Pour definir un mot de passe manuellement :"
echo "    - Editer SEED_PASSWORD dans .env"
echo "    - Relancer : docker compose -f docker-compose.prod.yml exec -T api npm run prisma:seed"
echo ""
echo "Commandes utiles :"
echo "  Logs        : docker compose -f docker-compose.prod.yml logs -f"
echo "  Update      : ./update.sh"
echo "  Backup      : ./backup.sh"
echo "  Arrêt       : docker compose -f docker-compose.prod.yml down"
echo ""
echo "============================================================"

