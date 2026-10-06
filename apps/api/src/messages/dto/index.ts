import { z } from "zod";

// ============================================================
// SCHEMAS
// ============================================================

export const MessageCreateSchema = z.object({
  schoolId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional().nullable(),
  guardianId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  type: z.enum(["REMINDER", "RECEIPT", "INVOICE", "OTHER"]).default("REMINDER"),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "INTERNAL"]).default("WHATSAPP"),
  recipientPhone: z.string().min(8, "Telephone requis").max(30),
  recipientName: z.string().max(150).optional(),
  message: z.string().min(1, "Message requis"),
  status: z.enum(["SENT", "FAILED"]).default("SENT"),
});

export const MessageListFiltersSchema = z.object({
  studentId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  type: z.string().optional(),
  channel: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type MessageCreateDto = z.infer<typeof MessageCreateSchema>;
export type MessageListFilters = z.infer<typeof MessageListFiltersSchema>;
