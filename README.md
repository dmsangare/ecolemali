# SIS-MALI — Système d'Information Scolaire

Application de gestion scolaire pour les établissements du Mali.

## Stack

- **Backend** : NestJS 10 + TypeScript + Prisma
- **Base de données** : PostgreSQL 16
- **Cache / Queue** : Redis 7
- **Frontend** : React 18 + Vite + TailwindCSS
- **PDF / Excel** : Puppeteer (Chromium Alpine) + xlsx
- **Déploiement** : Docker + Docker Compose + Nginx

## Installation rapide (Ubuntu LTS 22.04 / 24.04)

```bash
git clone git@github.com:dmsangare/ecolemali.git
cd ecolemali
cp .env.example .env
nano .env
sudo ./install.sh
```

Durée : 15-30 min selon débit réseau.

## Accès par défaut

| Service | URL |
|---|---|
| Interface Web | http://IP-SERVEUR/ |
| API REST | http://IP-SERVEUR/api/v1 |
| Swagger | http://IP-SERVEUR/api/docs |

## Comptes de démonstration

Mot de passe : Admin@2026!

| Email | Rôle |
|---|---|
| admin@sis-mali.local | Super Admin |
| director@sis-mali.local | Direction |
| accountant@sis-mali.local | Comptabilité |
| teacher@sis-mali.local | Enseignant |
| supervisor@sis-mali.local | Surveillant |
| secretary@sis-mali.local | Secrétariat |

## Structure

```
apps/api        Backend NestJS
apps/web        Frontend React
apps/worker     Jobs async (PDF)
packages/shared Types + Zod schemas
prisma/         Schéma + migrations
install.sh      Installation auto
update.sh       Mise à jour
backup.sh       Sauvegarde
```

## Modules

### Administration
Établissement, années scolaires, classes, utilisateurs, rôles, audit.

### Scolarité
Élèves, tuteurs, inscriptions, transferts, enseignants, matières, emploi du temps.

### Pédagogie
Présences, évaluations, notes, bulletins, examens.

### Finance
Grille tarifaire, factures, paiements, caisse, rapports.

## Sécurité

- Mots de passe hashés bcrypt (cost 12)
- JWT access (15 min) + refresh (7 jours)
- RBAC granulaire (8 rôles, 28 modules, 11 actions)
- Audit automatique
- Rate limiting (100 req/min)

## Licence

Propriétaire — SIS-MALI 2026
