import { z } from "zod";

export const AnnualDecisionProposeSchema = z.object({
  reportCardId: z.string().uuid(),
  decision: z.enum(["ADMIS", "REDOUBLE", "A_EXAMINER"]),
  motive: z.string().min(5).max(500).optional(),
});

export const AnnualDecisionValidateSchema = z.object({
  decision: z.enum(["ADMIS", "REDOUBLE", "A_EXAMINER"]),
  motive: z.string().max(500).optional(),
});

export const AnnualDecisionReopenSchema = z.object({
  motive: z.string().min(5).max(500),
});

export const AnnualDecisionListQuerySchema = z.object({
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  filter: z.enum(["ALL", "ADMIS", "REDOUBLE", "A_EXAMINER", "INCOMPLET"]).optional().default("ALL"),
});

export type AnnualDecisionProposeDto = z.infer<typeof AnnualDecisionProposeSchema>;
export type AnnualDecisionValidateDto = z.infer<typeof AnnualDecisionValidateSchema>;
export type AnnualDecisionReopenDto = z.infer<typeof AnnualDecisionReopenSchema>;
export type AnnualDecisionListQueryDto = z.infer<typeof AnnualDecisionListQuerySchema>;
