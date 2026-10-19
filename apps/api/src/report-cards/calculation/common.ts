/**
 * Fonctions communes de calcul (BLOC 7).
 * Pures, sans dépendance Prisma, testables en Jest.
 */

export type RoundingMode = "ROUND" | "TRUNCATE";

export interface RoundOptions {
  decimals: number;
  mode: RoundingMode;
}

/** Arrondi ou troncature à N décimales. */
export function roundScore(value: number, opts: RoundOptions = { decimals: 2, mode: "ROUND" }): number {
  const factor = Math.pow(10, opts.decimals);
  if (opts.mode === "TRUNCATE") {
    return Math.trunc(value * factor) / factor;
  }
  return Math.round(value * factor) / factor;
}

/**
 * Rang avec ex-aequo.
 * Exemple : [15, 15, 12, 10] → rangs [1, 1, 3, 4].
 */
export function calculateRank(target: number, allAverages: Array<number | null>): number {
  const valid = allAverages.filter((a): a is number => a !== null && !Number.isNaN(a));
  const better = valid.filter((a) => a > target).length;
  return better + 1;
}

/** Cycle à partir du numéro de niveau (1-6 = PREMIER, 7-9 = DEUXIEME). */
export function getCycleFromLevel(level: number): "PREMIER_CYCLE" | "DEUXIEME_CYCLE" {
  if (level >= 1 && level <= 6) return "PREMIER_CYCLE";
  if (level >= 7 && level <= 9) return "DEUXIEME_CYCLE";
  throw new Error(`Niveau invalide : ${level} (attendu : 1-9)`);
}

export interface PartialResult {
  value: number | null;
  count: number;
  missing: number;
  complete: boolean;
}

/** Moyenne d'un tableau de notes (null exclues, signalées). */
export function calculateAverage(
  values: Array<number | null>,
  opts: RoundOptions = { decimals: 2, mode: "ROUND" },
): PartialResult {
  const valid = values.filter((v): v is number => v !== null && !Number.isNaN(v));
  if (valid.length === 0) {
    return { value: null, count: 0, missing: values.length, complete: false };
  }
  const sum = valid.reduce((s, v) => s + v, 0);
  return {
    value: roundScore(sum / valid.length, opts),
    count: valid.length,
    missing: values.length - valid.length,
    complete: valid.length === values.length,
  };
}
