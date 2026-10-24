/**
 * DEC-3 — Normalisation de barème (CdC §3.2).
 * Centralisée dans le moteur commun de calcul.
 */
export function normalizeScore(value: number, maxScore: number, scale: number): number {
  if (!(maxScore > 0)) {
    throw new Error(`maxScore invalide : ${maxScore} (doit être > 0)`);
  }
  if (!(scale > 0)) {
    throw new Error(`scale invalide : ${scale} (doit être > 0)`);
  }
  return (value / maxScore) * scale;
}
