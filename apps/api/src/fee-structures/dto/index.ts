import { z } from "zod";
import { FeeStructureCreateSchema } from "@sis-mali/shared";

export type FeeStructureCreateDto = z.infer<typeof FeeStructureCreateSchema>;
export { FeeStructureCreateSchema };
