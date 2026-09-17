import { z } from "zod";
import { ExamCreateSchema, ExamUpdateSchema, ExamSessionCreateSchema } from "@sis-mali/shared";

export type ExamCreateDto = z.infer<typeof ExamCreateSchema>;
export type ExamUpdateDto = z.infer<typeof ExamUpdateSchema>;
export type ExamSessionCreateDto = z.infer<typeof ExamSessionCreateSchema>;
export { ExamCreateSchema, ExamUpdateSchema, ExamSessionCreateSchema };

export const ExamGradesBulkSchema = z.object({
  candidates: z.array(z.object({
    studentId: z.string().uuid(),
    isPresent: z.boolean().optional(),
    score: z.number().min(0).max(100).nullable().optional(),
    observation: z.string().optional(),
  })).min(1),
});

export type ExamGradesBulkDto = z.infer<typeof ExamGradesBulkSchema>;
