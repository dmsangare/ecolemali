/**
 * Regles de notation par cycle (systeme scolaire malien).
 *
 *  - 1er cycle (1ere - 6eme annee)        : notes sur 10, composition chaque MOIS.
 *  - 2eme cycle (7eme - 9eme annee, DEF)  : notes sur 20 avec coefficients, composition chaque TRIMESTRE.
 *
 * Le DEF (9eme annee) est organise par l'Etat malien : il est hors du calcul de l'ecole.
 */

export interface CycleRules {
  scale: number;
  allowedTermTypes: string[];
  label: string;
}

export const CYCLE_RULES: Record<string, CycleRules> = {
  PREMIER_CYCLE: {
    scale: 10,
    allowedTermTypes: ["MOIS"],
    label: "1er cycle (1ere - 6eme annee) : notes sur 10, composition mensuelle",
  },
  DEUXIEME_CYCLE: {
    scale: 20,
    allowedTermTypes: ["TRIMESTRE", "SEMESTRE"],
    label: "2eme cycle (7eme - 9eme annee) : notes sur 20 avec coefficients, composition trimestrielle",
  },
};

const DEFAULT_RULES: CycleRules = CYCLE_RULES.DEUXIEME_CYCLE;

export function rulesForCycle(cycle?: string | null): CycleRules {
  return (cycle && CYCLE_RULES[cycle]) || DEFAULT_RULES;
}

/** Une classe de ce cycle peut-elle avoir un bulletin pour ce type de periode ? */
export function isTermAllowedForCycle(termType: string, cycle?: string | null): boolean {
  return rulesForCycle(cycle).allowedTermTypes.includes(termType);
}

export function describeTermMismatch(termType: string, termName: string): string {
  if (termType === "MOIS") {
    return (
      `La periode "${termName}" est une composition mensuelle : elle ne concerne que le 1er cycle ` +
      `(1ere - 6eme annee). Aucune classe du 1er cycle trouvee pour cette selection.`
    );
  }
  return (
    `La periode "${termName}" est un trimestre/semestre : il concerne le 2eme cycle. ` +
    `Le 1er cycle (1ere - 6eme annee) se calcule par composition mensuelle. ` +
    `Aucune classe compatible trouvee pour cette selection.`
  );
}

/** Ramene une note obtenue sur `maxScore` au bareme du cycle (ex. 14/20 -> 7/10). */
export function normalizeScore(value: number, maxScore: number, scale: number): number {
  if (!(maxScore > 0)) return value;
  return (value / maxScore) * scale;
}

/** Seuil exprime sur 20 (parametre de l'ecole) converti au bareme du cycle (10 sur 20 -> 5 sur 10). */
export function scaledThreshold(thresholdOn20: number, scale: number): number {
  return Math.round(((thresholdOn20 * scale) / 20) * 100) / 100;
}
