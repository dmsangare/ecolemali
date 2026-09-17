import { z } from "zod";
import { InvoiceCreateSchema, InvoiceCancelSchema } from "@sis-mali/shared";

export type InvoiceCreateDto = z.infer<typeof InvoiceCreateSchema>;
export type InvoiceCancelDto = z.infer<typeof InvoiceCancelSchema>;
export { InvoiceCreateSchema, InvoiceCancelSchema };
