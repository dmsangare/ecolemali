import { z } from "zod";
import { AssessmentCreateSchema, AssessmentUpdateSchema } from "@sis-mali/shared";

export type AssessmentCreateDto = z.infer<typeof AssessmentCreateSchema>;
export type AssessmentUpdateDto = z.infer<typeof AssessmentUpdateSchema>;
export { AssessmentCreateSchema, AssessmentUpdateSchema };
