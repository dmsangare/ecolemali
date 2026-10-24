/**
 * Décision annuelle de passage (BLOC 7).
 * Déterministe, sans accès base, testable en Jest.
 */

export type DecisionType = "ADMIS" | "REDOUBLE" | "A_EXAMINER" | "INCOMPLET";

export interface DecisionConfig {
  passingScore: number | null;
  examScore?: number | null;
}

/** Détermine la décision à partir de la moyenne annuelle et du seuil. */
export function determineDecision(
  annualAverage: number | null,
  complete: boolean,
  config: DecisionConfig,
): DecisionType {
  if (annualAverage === null || !complete) return "INCOMPLET";
  if (config.passingScore === null) return "A_EXAMINER";
  if (annualAverage >= config.passingScore) return "ADMIS";
  if (config.examScore !== null && config.examScore !== undefined && annualAverage >= config.examScore) {
    return "A_EXAMINER";
  }
  return "REDOUBLE";
}
