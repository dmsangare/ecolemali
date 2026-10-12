# SIS-MALI — Plan de mise à jour technique

**Roadmap technique** — dernière mise à jour : octobre 2026

---

## Contexte

SIS-MALI utilise une stack stable et éprouvée. Ce document liste les montées
de version à planifier pour maintenir la sécurité, la compatibilité et la
maintenabilité sur le long terme.

**Règle** : toute montée de version majeure doit être testée sur une branche
dédiée avant merge en production.

---

## Priorité haute (dans les 6 mois)

### Node.js 20 → 22 LTS
- **Raison** : Node 20 sort du support LTS en avril 2026
- **Impact** : API, frontend build, worker
- **Risque** : faible (API compatible)
- **Effort** : 1-2 h + tests

### NestJS 11 → 12 (à venir)
- **Raison** : nouvelles versions de @nestjs/common, swagger, etc.
- **Impact** : backend complet
- **Risque** : moyen (déjà passé de 10 à 11 en octobre 2026)
- **Effort** : 4-8 h + tests de non-régression

### Prisma 5 → 6
- **Raison** : support, performance, nouvelles features
- **Impact** : schéma, migrations, client
- **Risque** : faible (migration outillée)
- **Effort** : 2-3 h + vérification migrations

---

## Priorité moyenne (1-2 ans)

### PostgreSQL 16 → 18
- **Raison** : support long terme, optimisations
- **Impact** : docker-compose (changer image)
- **Risque** : faible (pg_dump + restore)
- **Effort** : 1 h + backup/restore test

### React 18 → 19
- **Raison** : nouvelles features (transitions, actions)
- **Impact** : frontend complet
- **Risque** : moyen (React 19 casse certaines APIs)
- **Effort** : 6-12 h

### Vite 5 → 7
- **Raison** : performance build, support
- **Impact** : build frontend
- **Risque** : moyen (config Vite à adapter)
- **Effort** : 2-4 h

### recharts 2 → 3
- **Raison** : recharts 2.x n'est plus maintenu (déprécié)
- **Impact** : graphiques du dashboard
- **Risque** : moyen (migration guide disponible)
- **Effort** : 2-3 h

---

## Priorité basse (optionnel)

### Tailwind 3 → 4
- **Raison** : refonte moteur CSS
- **Impact** : toute la couche styling
- **Risque** : élevé (config refonte complète)
- **Effort** : 1-3 jours

### TypeScript 5.3 → 5.7+
- **Raison** : amélioration types
- **Impact** : build
- **Risque** : faible
- **Effort** : 1 h

---

## Procédure de mise à jour

1. Créer une branche `upgrade/X-Y`
2. Modifier le `package.json` concerné
3. `npm install --legacy-peer-deps`
4. Corriger les erreurs de compilation (`npx tsc --noEmit`)
5. Tester manuellement toutes les fonctionnalités concernées
6. Faire un build Docker local (`./update.sh`)
7. Merger après validation

**Ne jamais upgrader plusieurs majeures en même temps** — une par une,
testée à chaque fois.

---

## Overrides npm actuels (sécurité)

Ces overrides sont en place pour forcer des versions corrigées de
dépendances transitives :

    lodash        ^4.17.24
    js-yaml       ^4.1.0
    qs            ^6.15.4
    uuid          ^11.1.1
    exceljs       uuid ^11.1.1
    multer        ^2.0.3
    extract-zip   ^2.0.1
    proxy-agent   ^6.5.0
    basic-ftp     ^6.2.3

À réévaluer à chaque montée de version majeure.

---

## Historique des upgrades majeurs

| Date | Upgrade | Statut |
|---|---|---|
| Oct 2026 | NestJS 10 → 11 | ✅ Fait |
| Oct 2026 | puppeteer → puppeteer-core | ✅ Fait |
| Oct 2026 | xlsx → exceljs (backend) | ✅ Fait |
| Oct 2026 | react-router-dom 6 → 7 | ✅ Fait |
