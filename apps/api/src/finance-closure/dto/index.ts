import { z } from "zod";

// ============================================================
// BLOC H — DTO cloture financiere annuelle
// ============================================================

export const ExecuteFinanceClosureSchema = z.object({
  yearId: z.string().uuid(),
  /** Si true, on cloture meme s'il reste des impayes (report automatique). */
  carryOverDebts: z.boolean().default(true),
  /** Si true, on reporte les credits (avances) sur le compte de l'eleve. */
  carryOverCredits: z.boolean().default(true),
  /** Si true, on tolere les caisses encore ouvertes (deconseille). */
  ignoreOpenCashSessions: z.boolean().default(false),
});

export type ExecuteFinanceClosureDto = z.infer<typeof ExecuteFinanceClosureSchema>;
