import { z } from "zod";
import { RoomCreateSchema, RoomUpdateSchema } from "@sis-mali/shared";

export type RoomCreateDto = z.infer<typeof RoomCreateSchema>;
export type RoomUpdateDto = z.infer<typeof RoomUpdateSchema>;
export { RoomCreateSchema, RoomUpdateSchema };
