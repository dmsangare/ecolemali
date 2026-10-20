/**
 * Calculs 1er cycle (1re-6e) : compositions mensuelles, notes /10, sans coefficient.
 */
import { calculateAverage, roundScore, PartialResult, RoundOptions } from "./common";

export interface GradeInput {
  value: number | null;
  status?: string;
  isAbsent?: boolean;
  isExempt?: boolean;
}

/** Statut effectif : status prioritaire, sinon isAbsent/isExempt. */
function effectiveStatus(g: GradeInput): string {
  if (g.status) return g.status;
  if (g.isExempt) return "EXEMPT";
  if (g.isAbsent) return "ABSENT";
  return "PRESENT";
}

/** Moyenne d'une composition = moyenne simple des notes de matières. */
export function calculateCompositionAverage(
  grades: GradeInput[],
  opts: RoundOptions = { decimals: 2, mode: "ROUND" },
): PartialResult {
  const excluded = grades.filter((g) => g.isAbsent || g.isExempt).length;
  const validValues = grades
    .filter((g) => {
      const st = effectiveStatus(g);
      return st !== "ABSENT" && st !== "EXEMPT";
    })
    .map((g) => g.value);
  const result = calculateAverage(validValues, opts);
  return { ...result, excluded };
}

export interface FirstCycleAnnualResult {
  sum: number | null;
  average: number | null;
  count: number;
  missing: number;
  complete: boolean;
}

/** Moyenne annuelle 1er cycle = (Compo_1 + ... + Compo_9) / 9. */
export function calculateFirstCycleAnnual(
  compositions: Array<number | null>,
  opts: RoundOptions = { decimals: 2, mode: "ROUND" },
): FirstCycleAnnualResult {
  const valid = compositions.filter((c): c is number => c !== null && !Number.isNaN(c));
  if (valid.length === 0) {
    return { sum: null, average: null, count: 0, missing: compositions.length, complete: false };
  }
  const sum = roundScore(valid.reduce((s, v) => s + v, 0), opts);
  const average = roundScore(sum / valid.length, opts);
  return {
    sum,
    average,
    count: valid.length,
    missing: compositions.length - valid.length,
    complete: valid.length === compositions.length,
  };
}
