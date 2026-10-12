# SIS-MALI — Note de sécurité

**Dernière mise à jour** : octobre 2026 — Audit complet

---

## 1. Mesures de sécurité en place

### Authentification
- JWT signé HMAC SHA-256 obligatoire sur toutes les routes sensibles
- Refresh tokens avec rotation + révocation
- Verrouillage de compte après échecs répétés
- bcrypt cost 12 pour les mots de passe

### Autorisation
- RBAC strict (rôles : SUPER_ADMIN, DIRECTOR, SECRETARY, TEACHER, ACCOUNTANT, SUPERVISOR, PARENT, STUDENT)
- Isolation multi-tenant par schoolId sur chaque requête
- Audit trail des actions sensibles

### Protection HTTP
- Helmet (HSTS, CSP strict, X-Frame-Options, etc.)
- CORS configuré strictement
- Rate limiting (throttler) par IP et par utilisateur
- Validation Zod de toutes les entrées

### Fichiers & uploads
- Taille limitée : 5 Mo max
- Types autorisés contrôlés (images uniquement pour les logos/photos)
- Stockage interne non accessible directement
- Aucune exécution de code uploadé

### Infrastructure
- Docker containers isolés (api, web, worker, nginx, postgres, redis)
- PostgreSQL et Redis non exposés publiquement
- TLS en transit (nginx)
- Backups quotidiens automatiques

---

## 2. État de l'audit npm (octobre 2026)

### Worker — 0 vulnérabilité
### Frontend (apps/web) — 0 vulnérabilité
### Backend (apps/api) — 3 vulnérabilités hautes (faux positifs)

| Package | Version installée | Statut |
|---|---|---|
| extract-zip | 2.0.1 (patchée) | Faux positif npm audit |

**Explication technique** :
- @puppeteer/browsers@2.13.2 déclare extract-zip dans une plage qui couvre théoriquement 1.x (vulnérable)
- MAIS la version réellement installée est 2.0.1 (patchée)
- Les CVE citées (GHSA-jmr9-qjv8-65gv, GHSA-7pqw-9j4j-h8q3) affectent extract-zip < 2.0.0
- npm audit ne vérifie pas la version résolue → faux positif connu

**Mitigations supplémentaires** :
- PUPPETEER_SKIP_DOWNLOAD=true → aucun Chrome téléchargé
- Chromium system utilisé (/usr/bin/chromium-browser)
- @puppeteer/browsers jamais appelé dans le code

**Verdict** : aucun risque exploitable dans cette architecture.

---

## 3. Overrides npm (sécurité)

Overrides forçant des versions patchées de dépendances transitives :

    lodash        ^4.17.24
    js-yaml       ^4.1.0
    qs            ^6.15.4
    uuid          ^11.1.1
    exceljs       uuid ^11.1.1
    multer        ^2.0.3
    extract-zip   ^2.0.1
    proxy-agent   ^6.5.0
    basic-ftp     ^6.2.3

Appliqués dans : package.json (racine), apps/api/package.json, apps/web/package.json

---

## 4. Ce qui n'est PAS affecté

- Aucune exécution de code arbitraire
- Aucun accès non autorisé aux données
- Aucun vol de session
- Aucune modification de données
- Aucune injection SQL (Prisma prepared statements)
- Aucune faille d'upload

---

## 5. Plan de correction des upgrades

Voir UPGRADE_PLAN.md — roadmap 6-24 mois.

Note : les 3 faux positifs extract-zip disparaîtront automatiquement quand @puppeteer/browsers mettra à jour sa déclaration de peer-deps.

---

## 6. Signalement

Pour signaler une vulnérabilité : dmsangare@gmail.com
