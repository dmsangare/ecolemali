import { z } from "zod";

// ============================================================
// BLOC J — DTO examens d'Etat (DEF / BAC)
// ============================================================

export const StateExamResultEnum = z.enum([
  "ADMIS",       // admis a l'examen d'Etat
  "REFUSE",      // refuse (doit redoubler)
  "ABSENT",      // absent a l'examen
  "EN_ATTENTE",  // resultat non encore connu
]);

export const StateExamCandidateUpdateSchema = z.object({
  studentId: z.string().uuid(),
  result: StateExamResultEnum,
  score: z.number().min(0).max(20).optional(),
  observation: z.string().max(300).optional(),
});

export const SaveStateExamResultsSchema = z.object({
  levelId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  results: z.array(StateExamCandidateUpdateSchema).min(1),
});

export type StateExamResult = z.infer<typeof StateExamResultEnum>;
export type StateExamCandidateUpdate = z.infer<typeof StateExamCandidateUpdateSchema>;
export type SaveStateExamResultsDto = z.infer<typeof SaveStateExamResultsSchema>;
