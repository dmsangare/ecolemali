import { z } from "zod";
import { AcademicYearCreateSchema, AcademicYearUpdateSchema } from "@sis-mali/shared";

export type AcademicYearCreateDto = z.infer<typeof AcademicYearCreateSchema>;
export type AcademicYearUpdateDto = z.infer<typeof AcademicYearUpdateSchema>;
export { AcademicYearCreateSchema, AcademicYearUpdateSchema };
