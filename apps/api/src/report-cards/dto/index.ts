import { z } from "zod";
import { ReportCardGenerateSchema, ReportCardUpdateSchema, ReportCardReopenSchema } from "@sis-mali/shared";

export type ReportCardGenerateDto = z.infer<typeof ReportCardGenerateSchema>;
export type ReportCardUpdateDto = z.infer<typeof ReportCardUpdateSchema>;
export type ReportCardReopenDto = z.infer<typeof ReportCardReopenSchema>;
export { ReportCardGenerateSchema, ReportCardUpdateSchema, ReportCardReopenSchema };
