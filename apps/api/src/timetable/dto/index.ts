import { z } from "zod";
import { TimetableSlotCreateSchema, TimetableSlotUpdateSchema } from "@sis-mali/shared";

export type TimetableSlotCreateDto = z.infer<typeof TimetableSlotCreateSchema>;
export type TimetableSlotUpdateDto = z.infer<typeof TimetableSlotUpdateSchema>;
export { TimetableSlotCreateSchema, TimetableSlotUpdateSchema };
