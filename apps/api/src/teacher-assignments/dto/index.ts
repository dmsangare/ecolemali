import { z } from "zod";
import { TeacherAssignmentCreateSchema } from "@sis-mali/shared";

export type TeacherAssignmentCreateDto = z.infer<typeof TeacherAssignmentCreateSchema>;
export { TeacherAssignmentCreateSchema };

export const BulkAssignmentSchema = z.object({
  teacherId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  assignments: z.array(z.object({
    subjectId: z.string().uuid(),
    classId: z.string().uuid(),
    isMain: z.boolean().optional().default(false),
  })).min(1),
});

export type BulkAssignmentDto = z.infer<typeof BulkAssignmentSchema>;
