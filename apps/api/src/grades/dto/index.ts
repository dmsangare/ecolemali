import { z } from "zod";
import { GradeEntrySchema, GradesBulkSchema, GradeUpdateSchema } from "@sis-mali/shared";

export type GradeEntryDto = z.infer<typeof GradeEntrySchema>;
export type GradesBulkDto = z.infer<typeof GradesBulkSchema>;
export type GradeUpdateDto = z.infer<typeof GradeUpdateSchema>;
export { GradeEntrySchema, GradesBulkSchema, GradeUpdateSchema };
