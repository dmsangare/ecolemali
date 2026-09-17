import { z } from "zod";
import { TeacherCreateSchema, TeacherUpdateSchema } from "@sis-mali/shared";

export type TeacherCreateDto = z.infer<typeof TeacherCreateSchema>;
export type TeacherUpdateDto = z.infer<typeof TeacherUpdateSchema>;
export { TeacherCreateSchema, TeacherUpdateSchema };
