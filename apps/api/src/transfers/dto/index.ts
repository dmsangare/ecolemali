import { z } from "zod";

// ============================================================
// CREATE OUTBOUND TRANSFER
// ============================================================

export const CreateOutboundTransferSchema = z.object({
  studentId: z.string().uuid("ID eleve invalide"),
  toSchool: z.string().min(2, "Nom de l ecole de destination requis"),
  toSchoolAddress: z.string().optional(),
  toSchoolPhone: z.string().optional(),
  toSchoolDirector: z.string().optional(),
  reason: z.enum(["DEMENAGEMENT", "PASSAGE", "DISCIPLINE", "FAMILIALE", "AUTRE"]),
  reasonDetails: z.string().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format AAAA-MM-JJ requis"),
  notes: z.string().optional(),
});

export type CreateOutboundTransferDto = z.infer<typeof CreateOutboundTransferSchema>;

// ============================================================
// CREATE INBOUND TRANSFER
// ============================================================

export const CreateInboundTransferSchema = z.object({
  studentId: z.string().uuid("ID eleve invalide"),
  fromSchool: z.string().min(2, "Nom de l ecole d origine requis"),
  fromSchoolAddress: z.string().optional(),
  fromSchoolPhone: z.string().optional(),
  fromSchoolDirector: z.string().optional(),
  reason: z.enum(["DEMENAGEMENT", "PASSAGE", "DISCIPLINE", "FAMILIALE", "AUTRE"]),
  reasonDetails: z.string().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format AAAA-MM-JJ requis"),
  previousMatricule: z.string().optional(),
  previousClassLevel: z.string().optional(),
  previousAverage: z.coerce.number().min(0).max(20).optional(),
  decision: z.string().optional(),
  certificateUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInboundTransferDto = z.infer<typeof CreateInboundTransferSchema>;

// ============================================================
// REJECT
// ============================================================

export const RejectTransferSchema = z.object({
  reason: z.string().min(5, "Motif requis (min. 5 caracteres)"),
});

export type RejectTransferDto = z.infer<typeof RejectTransferSchema>;
