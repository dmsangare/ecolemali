import { z } from "zod";
import { EnrollmentCreateSchema, EnrollmentUpdateSchema } from "@sis-mali/shared";

export type EnrollmentCreateDto = z.infer<typeof EnrollmentCreateSchema>;
export type EnrollmentUpdateDto = z.infer<typeof EnrollmentUpdateSchema>;
export { EnrollmentCreateSchema, EnrollmentUpdateSchema };
