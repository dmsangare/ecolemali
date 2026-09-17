import { z } from "zod";
import {
  AttendanceSessionCreateSchema,
  AttendanceBulkUpdateSchema,
  AttendanceRecordSchema,
} from "@sis-mali/shared";

export type AttendanceSessionCreateDto = z.infer<typeof AttendanceSessionCreateSchema>;
export type AttendanceBulkUpdateDto = z.infer<typeof AttendanceBulkUpdateSchema>;
export type AttendanceRecordDto = z.infer<typeof AttendanceRecordSchema>;
export { AttendanceSessionCreateSchema, AttendanceBulkUpdateSchema, AttendanceRecordSchema };
