import { z } from "zod";
import { SchoolCreateSchema, SchoolUpdateSchema } from "@sis-mali/shared";

export type SchoolCreateDto = z.infer<typeof SchoolCreateSchema>;
export type SchoolUpdateDto = z.infer<typeof SchoolUpdateSchema>;
export { SchoolCreateSchema, SchoolUpdateSchema };
