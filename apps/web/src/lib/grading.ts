/** Regles de notation par cycle (miroir du backend : apps/api/src/report-cards/grading-rules.ts). */

/** 1er cycle : compositions mensuelles (MOIS). 2eme cycle / lycee : trimestre ou semestre. */
export function isTermAllowedForCycle(termType: string, cycle?: string | null): boolean {
  if (!cycle) return true;
  return cycle === "PREMIER_CYCLE" ? termType === "MOIS" : termType !== "MOIS";
}

/** Bareme du bulletin : /10 au 1er cycle, /20 ensuite. */
export function scaleForCycle(cycle?: string | null): number {
  return cycle === "PREMIER_CYCLE" ? 10 : 20;
}
