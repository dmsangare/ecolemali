import { z } from "zod";
import { LevelCreateSchema, LevelUpdateSchema } from "@sis-mali/shared";

export type LevelCreateDto = z.infer<typeof LevelCreateSchema>;
export type LevelUpdateDto = z.infer<typeof LevelUpdateSchema>;
export { LevelCreateSchema, LevelUpdateSchema };
