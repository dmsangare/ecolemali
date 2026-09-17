import { z } from "zod";
import { GuardianCreateSchema, GuardianUpdateSchema } from "@sis-mali/shared";

export type GuardianCreateDto = z.infer<typeof GuardianCreateSchema>;
export type GuardianUpdateDto = z.infer<typeof GuardianUpdateSchema>;
export { GuardianCreateSchema, GuardianUpdateSchema };
