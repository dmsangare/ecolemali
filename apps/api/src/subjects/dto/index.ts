import { z } from "zod";
import { SubjectCreateSchema, SubjectUpdateSchema } from "@sis-mali/shared";

export type SubjectCreateDto = z.infer<typeof SubjectCreateSchema>;
export type SubjectUpdateDto = z.infer<typeof SubjectUpdateSchema>;
export { SubjectCreateSchema, SubjectUpdateSchema };
