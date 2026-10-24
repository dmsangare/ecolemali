/**
 * CONFORMITÉ MOTEUR DE CALCUL — CdC V1 SIS-MALI — v2
 *
 * Chaque test exprime la CONFORMITÉ ATTENDUE.
 * Un test DOIT FAIL aujourd'hui si le moteur n'est pas conforme.
 * Un test DOIT PASS après correction.
 */

import { roundScore, calculateRank } from "./common";
import { calculateCompositionAverage, calculateFirstCycleAnnual } from "./first-cycle";
import { calculateSubjectAverage, calculateTermAverage, calculateSecondCycleAnnual } from "./second-cycle";
import { determineDecision } from "./decision";

// ============================================================
// §11.1 — PREMIER CYCLE — cas numériques CdC
// ============================================================
describe("§11.1 — 1er cycle — cas numériques CdC", () => {
  it("[1] 8/10 seul → 8,00", () => {
    const r = calculateCompositionAverage([{ value: 8 }]);
    expect(r.value).toBe(8);
    expect(r.complete).toBe(true);
  });

  it("[2] 7, 8, 6 → 7,00", () => {
    const r = calculateCompositionAverage([{ value: 7 }, { value: 8 }, { value: 6 }]);
    expect(r.value).toBe(7);
    expect(r.complete).toBe(true);
  });

  it("[3] 7, 8, 6, 9, 8 → 7,60", () => {
    const r = calculateCompositionAverage([
      { value: 7 }, { value: 8 }, { value: 6 }, { value: 9 }, { value: 8 },
    ]);
    expect(r.value).toBe(7.6);
    expect(r.complete).toBe(true);
  });

  it("[4] 7, 8, absence justifiée, 6, 9 → 7,50 (absence exclue)", () => {
    const r = calculateCompositionAverage([
      { value: 7 },
      { value: 8 },
      { value: null, isAbsent: true },
      { value: 6 },
      { value: 9 },
    ]);
    expect(r.value).toBe(7.5);
    expect(r.excluded).toBe(1);
    expect(r.complete).toBe(true);
  });

  it("[5] Aucune note valide → moyenne non calculable", () => {
    const r = calculateCompositionAverage([
      { value: null, isAbsent: true },
      { value: null, isExempt: true },
    ]);
    expect(r.value).toBeNull();
    expect(r.complete).toBe(false);
  });

  it("[6] Zéro (0/10) est une note valide conservée", () => {
    const r = calculateCompositionAverage([{ value: 0 }, { value: 8 }]);
    expect(r.value).toBe(4);
    expect(r.count).toBe(2);
    expect(r.complete).toBe(true);
  });

  it("[8] Note manquante (null) ≠ 0 — dossier incomplet", () => {
    const r = calculateCompositionAverage([{ value: 8 }, { value: null }, { value: 6 }]);
    expect(r.value).toBe(7);
    expect(r.missing).toBe(1);
    expect(r.complete).toBe(false);
  });
});

// ============================================================
// §11.1 — CONFORMITÉ NÉGATIVE — refus barème (DEC-1)
// Ces tests DOIVENT FAIL aujourd'hui. Ils PASSERONT après correction.
// ============================================================
describe("§11.1 — CONFORMITÉ NÉGATIVE — refus du barème (DEC-1)", () => {
  it("[7] CONFORMITÉ : note 11/10 → le moteur DOIT lever une erreur", () => {
    expect(() => calculateCompositionAverage([{ value: 11 }])).toThrow();
  });

  it("[7bis] CONFORMITÉ : note -1/10 → le moteur DOIT lever une erreur", () => {
    expect(() => calculateCompositionAverage([{ value: -1 }])).toThrow();
  });
});

// ============================================================
// §11.2 — DEUXIÈME CYCLE — cas numériques CdC
// ============================================================
describe("§11.2 — 2e cycle — cas numériques CdC", () => {
  it("[9] 15, 12, 18 (poids égaux) → moyenne matière 15,00 (DEC-4a)", () => {
    const r = calculateSubjectAverage([{ value: 15 }, { value: 12 }, { value: 18 }]);
    expect(r.value).toBe(15);
  });

  it("[10] 3 matières coef 1, moyennes 15, 12, 18 → moyenne générale 15,00 (DEC-4b)", () => {
    const r = calculateTermAverage([
      { average: 15, coefficient: 1 },
      { average: 12, coefficient: 1 },
      { average: 18, coefficient: 1 },
    ]);
    expect(r.value).toBe(15);
  });

  it("[12] 15×4, 14×3, 12×2, 16×2 → 14,36", () => {
    const r = calculateTermAverage([
      { average: 15, coefficient: 4 },
      { average: 14, coefficient: 3 },
      { average: 12, coefficient: 2 },
      { average: 16, coefficient: 2 },
    ]);
    expect(r.value).toBe(14.36);
  });

  it("[13] Trimestres 12,50 / 14,00 / 11,50 → 12,67", () => {
    const r = calculateSecondCycleAnnual([12.5, 14, 11.5]);
    expect(r.average).toBe(12.67);
  });

  it("[14] Trimestres 12,50 / 14,00 / 15,50 → 14,00", () => {
    const r = calculateSecondCycleAnnual([12.5, 14, 15.5]);
    expect(r.average).toBe(14);
  });

  it("[15] Trimestre manquant → incomplet, pas de 0 substitué", () => {
    const r = calculateSecondCycleAnnual([12.5, null, 11.5]);
    expect(r.complete).toBe(false);
    expect(r.missing).toBe(1);
    expect(r.average).toBe(12);
  });
});

// ============================================================
// §11.2 — CONFORMITÉ NÉGATIVE — refus coefficients (DEC-2)
// ============================================================
describe("§11.2 — CONFORMITÉ NÉGATIVE — refus coefficients invalides (DEC-2)", () => {
  it("[16a] CONFORMITÉ : coefficient 0 → le moteur DOIT lever une erreur", () => {
    expect(() =>
      calculateTermAverage([{ average: 12, coefficient: 0 }])
    ).toThrow();
  });

  it("[16b] CONFORMITÉ : coefficient négatif → le moteur DOIT lever une erreur", () => {
    expect(() =>
      calculateTermAverage([{ average: 14, coefficient: -2 }])
    ).toThrow();
  });

  it("[16c] CONFORMITÉ : coefficient présent mais invalide parmi d'autres valides → DOIT lever une erreur", () => {
    expect(() =>
      calculateTermAverage([
        { average: 12, coefficient: 4 },
        { average: 14, coefficient: 0 },
      ])
    ).toThrow();
  });
});

// ============================================================
// §3.2 — CONFORMITÉ NÉGATIVE — normalisation intégrée (DEC-3)
// Le moteur pur doit pouvoir normaliser (intégrer normalizeScore)
// ou exposer une fonction dédiée appelée par les services.
// On vérifie que l'export existe dans le moteur.
// ============================================================
describe("§3.2 — normalisation de barème (DEC-3)", () => {
  it("[11] CONFORMITÉ : une fonction de normalisation est exposée par le moteur", () => {
    // On tente d'importer la fonction de normalisation depuis le moteur.
    // Aujourd'hui : elle est dans grading-rules.ts, PAS dans calculation/.
    // Le test doit FAIL tant qu'elle n'est pas rapatriée dans calculation/.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("./normalize");
    expect(typeof mod.normalizeScore).toBe("function");
    expect(mod.normalizeScore(8, 10, 20)).toBe(16);
  });
});

// ============================================================
// §5 — ARRONDI ET ÉGALITÉS
// ============================================================
describe("§5 — Arrondis et égalités", () => {
  it("[17] Arrondi 2 décimales ROUND : 12.6666 → 12.67", () => {
    expect(roundScore(12.6666)).toBe(12.67);
  });

  it("[18] Égalités compétition : 15, 15, 12, 10 → 1, 1, 3, 4", () => {
    const all = [15, 15, 12, 10];
    expect(calculateRank(15, all)).toBe(1);
    expect(calculateRank(12, all)).toBe(3);
    expect(calculateRank(10, all)).toBe(4);
  });
});

// ============================================================
// §4.3 — DÉCISION DE PASSAGE
// ============================================================
describe("§4.3 — Décision", () => {
  it("[19] Moyenne ≥ seuil → ADMIS", () => {
    expect(determineDecision(12.67, true, { passingScore: 10 })).toBe("ADMIS");
  });
  it("[20] Moyenne < seuil → REDOUBLE", () => {
    expect(determineDecision(8, true, { passingScore: 10 })).toBe("REDOUBLE");
  });
  it("[21] Dossier incomplet → INCOMPLET", () => {
    expect(determineDecision(12, false, { passingScore: 10 })).toBe("INCOMPLET");
  });
});
