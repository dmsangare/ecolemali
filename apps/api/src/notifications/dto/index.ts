import { z } from "zod";
import { NotificationCreateSchema, NotificationBulkSchema } from "@sis-mali/shared";

export type NotificationCreateDto = z.infer<typeof NotificationCreateSchema>;
export type NotificationBulkDto = z.infer<typeof NotificationBulkSchema>;
export { NotificationCreateSchema, NotificationBulkSchema };
