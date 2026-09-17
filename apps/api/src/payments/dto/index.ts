import { z } from "zod";
import { PaymentCreateSchema, PaymentCancelSchema } from "@sis-mali/shared";

export type PaymentCreateDto = z.infer<typeof PaymentCreateSchema>;
export type PaymentCancelDto = z.infer<typeof PaymentCancelSchema>;
export { PaymentCreateSchema, PaymentCancelSchema };
