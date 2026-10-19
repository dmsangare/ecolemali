/**
 * Calculs 2e cycle (7e-9e) : trimestres, notes /20, avec coefficients.
 */
import { calculateAverage, roundScore, PartialResult, RoundOptions } from "./common";

export interface GradeInput {
  value: number | null;
  coefficient?: number;
  isAbsent?: boolean;
  isExempt?: boolean;
}

/** Moyenne d'une matière sur un trimestre. */
export function calculateSubjectAverage(
  grades: GradeInput[],
  opts: RoundOptions = { decimals: 2, mode: "ROUND" },
): PartialResult {
  const validValues = grades
    .filter((g) => !g.isAbsent && !g.isExempt)
    .map((g) => g.value);
  return calculateAverage(validValues, opts);
}

export interface SubjectAverageInput {
  average: number | null;
  coefficient: number;
}

/** Moyenne générale d'un trimestre = Σ(moyenne matière × coef) / Σ(coef). */
export function calculateTermAverage(
  items: SubjectAverageInput[],
  opts: RoundOptions = { decimals: 2, mode: "ROUND" },
): PartialResult {
  const valid = items.filter((i): i is SubjectAverageInput & { average: number } =>
    i.average !== null && !Number.isNaN(i.average),
  );
  if (valid.length === 0) {
    return { value: null, count: 0, missing: items.length, complete: false };
  }
  const totalWeighted = valid.reduce((s, i) => s + i.average * i.coefficient, 0);
  const totalCoefficients = valid.reduce((s, i) => s + i.coefficient, 0);
  if (totalCoefficients === 0) {
    return { value: null, count: 0, missing: items.length, complete: false };
  }
  return {
    value: roundScore(totalWeighted / totalCoefficients, opts),
    count: valid.length,
    missing: items.length - valid.length,
    complete: valid.length === items.length,
  };
}

export interface SecondCycleAnnualResult {
  sum: number | null;
  average: number | null;
  count: number;
  missing: number;
  complete: boolean;
}

/** Moyenne annuelle 2e cycle = (Trim_1 + Trim_2 + Trim_3) / 3. */
export function calculateSecondCycleAnnual(
  terms: Array<number | null>,
  opts: RoundOptions = { decimals: 2, mode: "ROUND" },
): SecondCycleAnnualResult {
  const valid = terms.filter((t): t is number => t !== null && !Number.isNaN(t));
  if (valid.length === 0) {
    return { sum: null, average: null, count: 0, missing: terms.length, complete: false };
  }
  const sum = roundScore(valid.reduce((s, v) => s + v, 0), opts);
  const average = roundScore(sum / valid.length, opts);
  return {
    sum,
    average,
    count: valid.length,
    missing: terms.length - valid.length,
    complete: valid.length === terms.length,
  };
}
