import { z } from "zod";
import {
  BackupSettingsSchema,
  BackupSettingsUpdateSchema,
} from "@sis-mali/shared";

// ============================================================
// Réexport des schémas partagés
// ============================================================

export { BackupSettingsSchema, BackupSettingsUpdateSchema };

export type BackupSettingsDto = z.infer<typeof BackupSettingsSchema>;
export type BackupSettingsUpdateDto = z.infer<typeof BackupSettingsUpdateSchema>;

// ============================================================
// Query DTO — Liste des backups (pagination + filtre)
// ============================================================

export const BackupListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["DB", "FILES", "FULL"]).optional(),
});

export type BackupListQueryDto = z.infer<typeof BackupListQuerySchema>;

// ============================================================
// DTO — Restauration (avec confirmation stricte)
// ============================================================

export const BackupRestoreSchema = z.object({
  confirmation: z
    .string()
    .refine((val) => val === "RESTAURER", {
      message: "Saisissez exactement 'RESTAURER' pour confirmer",
    }),
  createSafetyBackup: z.boolean().default(true),
});

export type BackupRestoreDto = z.infer<typeof BackupRestoreSchema>;
