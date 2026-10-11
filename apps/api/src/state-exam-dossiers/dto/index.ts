import { z } from 'zod';

// --- Session ---
export const CreateSessionSchema = z.object({
  academicYearId: z.string().uuid(),
  examType: z.enum(['DEF', 'BAC']),
  label: z.string().min(3).max(120),
  registrationOpens: z.string().optional(),
  registrationCloses: z.string().optional(),
  examDate: z.string().optional(),
  institutionTarget: z.string().optional(),
  bordereauPattern: z.string().optional(),
});
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// --- Génération dossiers ---
export const GenerateDossiersSchema = z.object({
  piecesRequired: z
    .array(z.string())
    .optional()
    .default(['ACTE_NAISSANCE', 'CERTIFICAT_SCOLARITE', 'PHOTO', 'FRAIS']),
  classIds: z.array(z.string().uuid()).optional(),
});
export type GenerateDossiersInput = z.infer<typeof GenerateDossiersSchema>;

// --- Patch dossier ---
export const PatchDossierSchema = z.object({
  observations: z.string().optional(),
  piecesRequired: z.array(z.string()).optional(),
  bordereauNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
});
export type PatchDossierInput = z.infer<typeof PatchDossierSchema>;

// --- Piece ---
export const PatchPieceSchema = z.object({
  isPresent: z.boolean().optional(),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});
export type PatchPieceInput = z.infer<typeof PatchPieceSchema>;

// --- Transmission ---
export const TransmitSchema = z.object({
  transmittedAt: z.string().optional(),
  proofUrl: z.string().optional(),
  observations: z.string().optional(),
});
export type TransmitInput = z.infer<typeof TransmitSchema>;

// --- Réception ---
export const ReceiveSchema = z.object({
  receivedAt: z.string().optional(),
  receiptUrl: z.string().optional(),
  observations: z.string().optional(),
});
export type ReceiveInput = z.infer<typeof ReceiveSchema>;
