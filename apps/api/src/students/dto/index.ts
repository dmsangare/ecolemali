import { z } from "zod";
import { StudentCreateSchema, StudentUpdateSchema } from "@sis-mali/shared";

export type StudentCreateDto = z.infer<typeof StudentCreateSchema>;
export type StudentUpdateDto = z.infer<typeof StudentUpdateSchema>;
export { StudentCreateSchema, StudentUpdateSchema };
