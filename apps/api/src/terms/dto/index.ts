import { z } from "zod";
import { TermCreateSchema, TermUpdateSchema } from "@sis-mali/shared";

export type TermCreateDto = z.infer<typeof TermCreateSchema>;
export type TermUpdateDto = z.infer<typeof TermUpdateSchema>;
export { TermCreateSchema, TermUpdateSchema };
