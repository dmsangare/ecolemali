import { z } from 'zod';

// ============================================================
// DTO — Admin Reports (RAP-01..13)
// ============================================================

// --- Filtres liste templates ---
export const ListTemplatesQuerySchema = z.object({
  category: z
    .enum([
      'RENTREE',
      'STATISTIQUES',
      'PERSONNEL',
      'INFRASTRUCTURES',
      'SITUATION_ANNUELLE',
      'FIN_ANNEE',
      'EXAMENS',
      'COMPLEMENTAIRE',
    ])
    .optional(),
  status: z
    .enum([
      'MODELE_INTERNE',
      'INSTRUCTION_LOCALE_VERIFIEE',
      'OFFICIEL_VERIFIE',
      'A_CONFIRMER',
      'ARCHIVE',
    ])
    .optional(),
  activeOnly: z.coerce.boolean().optional().default(true),
});
export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuerySchema>;

// --- Filtres liste rapports ---
export const ListReportsQuerySchema = z.object({
  status: z
    .enum([
      'NON_PREPARE',
      'BROUILLON',
      'EN_VERIFICATION',
      'A_VALIDER',
      'VALIDE',
      'PRET_A_TRANSMETTRE',
      'TRANSMIS',
      'RECEPTION_CONFIRMEE',
      'A_CORRIGER',
      'NOUVELLE_VERSION_REQUISE',
      'CLOTURE',
    ])
    .optional(),
  academicYearId: z.string().uuid().optional(),
  category: z.string().optional(),
});
export type ListReportsQuery = z.infer<typeof ListReportsQuerySchema>;
