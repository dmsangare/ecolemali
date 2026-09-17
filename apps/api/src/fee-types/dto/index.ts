import { z } from "zod";
import { FeeTypeCreateSchema } from "@sis-mali/shared";

export type FeeTypeCreateDto = z.infer<typeof FeeTypeCreateSchema>;
export { FeeTypeCreateSchema };
