import { z } from "zod";
import { CashSessionOpenSchema, CashSessionCloseSchema } from "@sis-mali/shared";

export type CashSessionOpenDto = z.infer<typeof CashSessionOpenSchema>;
export type CashSessionCloseDto = z.infer<typeof CashSessionCloseSchema>;
export { CashSessionOpenSchema, CashSessionCloseSchema };
