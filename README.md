# SIS-MALI — Systeme d Information Scolaire

Application de gestion scolaire pour les ecoles fondamentales et lycees au Mali.

## Architecture

- Backend : NestJS 10 + TypeScript + Prisma
- Base de donnees : PostgreSQL 16
- Frontend : React 18 + Vite + TailwindCSS
- Conteneurisation : Docker + Docker Compose
- Reverse proxy : Nginx

## Prerequis

- Docker Desktop 24+
- Docker Compose 2.20+

## Demarrage rapide

Etape 1 : Cloner le projet
    git clone <url> sis-mali
    cd sis-mali

Etape 2 : Copier les variables d environnement
    cp .env.example .env

Etape 3 : Demarrer les services
    docker compose up -d

Etape 4 : Attendre PostgreSQL (~10 secondes)

Etape 5 : Appliquer les migrations Prisma
    docker compose exec api npx prisma migrate deploy

Etape 6 : Charger les donnees initiales
    docker compose exec api npm run prisma:seed

## Acces

| Service | URL |
|---|---|
| Interface Web | http://localhost |
| API REST | http://localhost/api/v1 |
| Swagger | http://localhost/api/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Comptes de demonstration

Mot de passe pour tous : Admin@2026!

| Email | Role |
|---|---|
| admin@sis-mali.local | Super Administrateur |
| director@sis-mali.local | Direction |
| secretary@sis-mali.local | Secretariat |
| teacher@sis-mali.local | Enseignant |
| accountant@sis-mali.local | Comptable |
| supervisor@sis-mali.local | Surveillant |

## Structure du projet

    sis-mali/
    ├── apps/
    │   ├── api/          # Backend NestJS
    │   ├── web/          # Frontend React
    │   └── worker/       # Jobs async
    ├── packages/
    │   └── shared/       # Types + Zod schemas
    ├── prisma/           # Schema + seed
    ├── infra/            # Nginx + PostgreSQL init
    ├── docker/           # Configs Docker
    └── storage/          # Documents, uploads, backups

## Commandes utiles

Voir les logs
    docker compose logs -f api
    docker compose logs -f web

Redemarrer un service
    docker compose restart api

Prisma Studio (explorer la DB)
    docker compose exec api npx prisma studio

Reset complet
    docker compose down -v
    docker compose up -d
    docker compose exec api npx prisma migrate deploy
    docker compose exec api npm run prisma:seed

## Modules fonctionnels

### Administration
- Gestion des etablissements, annees scolaires, niveaux, classes, salles
- Gestion des utilisateurs et roles (RBAC granulaire)
- Journal d audit automatique

### Scolarite
- Eleves : fiche complete, matricule auto, parcours
- Tuteurs : liaison parent/enfant
- Inscriptions : workflow complet
- Enseignants et matieres

### Pedagogie
- Emploi du temps (detection conflits)
- Presences (saisie en masse)
- Evaluations et notes (workflow 5 etapes)
- Bulletins (calcul auto moyennes + rangs)
- Examens

### Finance
- Grille tarifaire
- Factures et paiements
- Recus automatiques
- Caisse journaliere
- Rapports financiers

### Communication
- Notifications internes
- Modeles de documents
- Generation PDF

## Securite

- Mots de passe hashes bcrypt (cost 12)
- JWT access (15 min) + refresh (7 jours)
- Verrouillage apres 5 tentatives echouees
- RBAC : 8 roles, 28 modules, 11 actions
- Journal d audit automatique
- Rate limiting

## Deploiement production

Voir docs/DEPLOYMENT.md pour le deploiement sur Ubuntu Server.

## Licence

Proprietaire — SIS-MALI 2026
