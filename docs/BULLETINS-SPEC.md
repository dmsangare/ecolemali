# SIS-MALI — Spécification module Bulletins (v3)

Date : 2026-10-19
Branche : feat/bulletins-v2
Commit de départ : bff62f3 (stable-before-bulletins-v2)

## 1. Contexte

Le module Bulletins actuel est fonctionnel (moteur `annual-calc.ts`,
règles `grading-rules.ts`, PDF `report-card-pdf.util.ts`) mais :

- La `BulletinConfig` (supprimée au BLOC 0) introduisait une duplication.
- Le bulletin 1er cycle n'affiche pas les domaines (maquette Word).
- Certaines corrections du PDF (barème, en-tête, échappement) restent à faire.
- La conformité au système malien doit être renforcée.

## 2. Décisions validées (Adama, 2026-10-19)

### Q1 — Moyenne élève 1er cycle
`Moyenne = somme des notes de matières / nombre de matières` (moyenne simple).

### Q2 — Périodes 1er cycle
9 compositions mensuelles (octobre → juin), notes /10, sans coefficient.
3 trimestres pour le 2e cycle, notes /20, avec coefficients.

### Q3 — Rang
Ex-aequo = même rang. Le rang suivant est sauté (1, 1, 3...).

### Q4 — Colonne Points (2e cycle)
Configurable par école (`showPointsColumn`).

### Q5 — Académie et CAP
Champs `School.academy` et `School.cap` existants. Ligne masquée si vide.

### Q6 — Conduite
Note chiffrée : /10 (1er cycle), /20 (2e cycle). Configurable (`conductScale`).

### Q7 — Décision
Affichée uniquement sur le bulletin ANNUEL.

### Q8 — Signatures
3 signatures : Le Maître / Le Directeur (avec cachet) / Visa du parent.

### Q9 — QR code
Sur tous les bulletins (période + annuel), via `VerifiableDocument`.

### Q10 — Bulletins produits
- 1er cycle : 9 bulletins de composition + 1 bulletin annuel = 10 PDF/an.
- 2e cycle : 3 bulletins trimestriels + 1 bulletin annuel = 4 PDF/an.
- Le bulletin annuel est officiel et archivé (décision de passage).
- Les bulletins périodiques sont consultables et imprimables.

## 3. Formules exactes

### 1er cycle
Compo_n = Σ(notes_matières) / nb_matières
Moyenne_annuelle = (Compo_1 + ... + Compo_9) / 9
Rang = 1 + count(élèves avec moyenne strictement supérieure)
Décision : PASSAGE si Moyenne_annuelle >= passingScore

### 2e cycle
Moy_mat = Σ(notes devoir + interro + compo) / nb_notes
Moy_trim = Σ(Moy_mat × coef) / Σ(coef)
Moy_annuelle = (Moy_trim_1 + Moy_trim_2 + Moy_trim_3) / 3
Rang, Décision : idem 1er cycle

### Arrondi
2 décimales, ROUND par défaut, appliqué une seule fois à la fin.

### Incomplet
Si une composition obligatoire manque → bulletin marqué incomplet.
Jamais de note manquante remplacée par 0. Jamais d'absence remplacée par 0.

## 4. Régressions à corriger (BLOC 9)

| # | Régression | Correction |
|---|---|---|
| R1 | Mot de passe pré-rempli | useState("") + placeholder |
| R2 | Logos et fichiers cassés | file-to-base64.util.ts (ancien + nouveau) |
| R3 | Cloche vers /notifications | Retirer ou créer la page |
| R4 | Chevauchement périodes | Contrôle par Term.type |
| R5 | Bulletin verrouillé | Action Rouvrir + motif + audit |
| R6 | En-tête PDF | Lire academy/cap de School, fermer div |

## 5. Ce qui existe déjà

| Élément | État |
|---|---|
| grading-rules.ts (échelles, cycles) | Opérationnel |
| annual-calc.ts (moteurs 1er et 2e cycle) | Opérationnel (à enrichir) |
| report-card-pdf.util.ts | Opérationnel (à améliorer BLOC 9) |
| VerifiableDocument (QR) | Opérationnel |
| Term.type (MOIS/TRIMESTRE) | En base (9 MOIS + 3 TRIMESTRES) |
| Term.isLocked | Existant |
| School.academy / School.cap | Existants |
| Grade.is_absent | Existant |
| Grade.observation | Existant |
| ReportCard / ReportCardItem | Existants (à enrichir) |
| StudentPathway | Existant |
| 66 modèles Prisma | Tous en place |

## 6. Ce qui est à ajouter (BLOC 6)

| Élément | Type |
|---|---|
| SubjectDomain | Nouveau modèle |
| GradeAudit | Nouveau modèle |
| Grade.status | Enum (PRESENT/ABSENT/EXEMPT/MISSING) |
| Grade.isExempt | Boolean |
| Grade.comment | Text |
| ReportCard.kind | Enum (COMPOSITION/TRIMESTRIEL/ANNUEL) |
| ReportCard.snapshot | JSON |
| ReportCard.isComplete | Boolean |
| ReportCard.ruleVersionId | String |
| ReportCard.conductScore | Decimal |
| ReportCard.conductAppreciation | Text |
| ReportCardItem.continuousAverage | Decimal |
| ReportCardItem.compositionScore | Decimal |
| ReportCardItem.domainId | UUID nullable |
| Subject.domainId | UUID nullable |

## 7. Liste de recette (12 tests)

Voir CDC v3 §6. Tests écrits au BLOC 7 (Jest).

## 8. Plan des blocs

| Bloc | Contenu | Durée |
|---|---|---|
| BLOC 5 | Audit + spec + Jest | 1 j |
| BLOC 6 | Schéma additif | 0,5 j |
| BLOC 7 | Moteur unique + 12 tests | 1 j |
| BLOC 8 | API v2 | 2-3 j |
| BLOC 9 | PDF + QR + page publique | 2-3 j |
| BLOC 10 | 6 écrans React | 5-6 j |
| BLOC 11 | Recette + Docker | 2 j |
| BLOC 12 | Nettoyage + docs | 1 j |

**Fin de la spécification.**
