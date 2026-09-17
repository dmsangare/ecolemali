import { z } from "zod";
import { ClassCreateSchema, ClassUpdateSchema } from "@sis-mali/shared";

export type ClassCreateDto = z.infer<typeof ClassCreateSchema>;
export type ClassUpdateDto = z.infer<typeof ClassUpdateSchema>;
export { ClassCreateSchema, ClassUpdateSchema };
