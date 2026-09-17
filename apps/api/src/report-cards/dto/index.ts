import { z } from "zod";
import { ReportCardGenerateSchema, ReportCardUpdateSchema } from "@sis-mali/shared";

export type ReportCardGenerateDto = z.infer<typeof ReportCardGenerateSchema>;
export type ReportCardUpdateDto = z.infer<typeof ReportCardUpdateSchema>;
export { ReportCardGenerateSchema, ReportCardUpdateSchema };
