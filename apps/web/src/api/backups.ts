import { api } from "@/lib/axios";

// ============================================================
// TYPES
// ============================================================

export interface Backup {
  id: string;
  schoolId: string | null;
  type: "DB" | "FILES" | "FULL";
  fileUrl: string;
  sizeBytes: number | null;
  createdBy: string | null;
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS";
  createdAt: string;
}

export interface BackupsListResponse {
  data: Backup[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export interface BackupSettings {
  enabled: boolean;
  cron: string;
  includeFiles: boolean;
  retention: { daily: number; weekly: number; monthly: number };
  lastRun: string | null;
  lastStatus: string | null;
  nextRun: string | null;
}

export interface BackupSettingsUpdate {
  enabled?: boolean;
  cron?: string;
  includeFiles?: boolean;
  retention?: { daily?: number; weekly?: number; monthly?: number };
}

export interface RestoreResponse {
  message: string;
  backupId: string;
  timestamp: string;
  safetyBackupId: string | null;
  checksumVerified: boolean;
}

// ============================================================
// API
// ============================================================

export const backupsApi = {
  /**
   * Liste paginée des sauvegardes.
   */
  async list(
    params: { page?: number; limit?: number; type?: string } = {},
  ): Promise<BackupsListResponse> {
    const { data } = await api.get("/backups", { params });
    return data as BackupsListResponse;
  },

  /**
   * Détail d'une sauvegarde.
   */
  async getById(id: string): Promise<Backup> {
    const { data } = await api.get(`/backups/${id}`);
    return data.data || data;
  },

  /**
   * Crée une sauvegarde complète (DB + documents).
   */
  async createFull(): Promise<Backup> {
    const { data } = await api.post("/backups/full");
    return data.data || data;
  },

  /**
   * Supprimé une sauvegarde (record + fichiers).
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/backups/${id}`);
  },

  /**
   * Restaure une sauvegarde.
   * ⚠️ Opération DESTRUCTIVE.
   *
   * @param id - ID de la sauvegarde
   * @param confirmation - Doit être exactement "RESTAURER"
   * @param createSafetyBackup - Créer un backup de sécurité avant (défaut: true)
   */
  async restore(
    id: string,
    confirmation: string,
    createSafetyBackup = true,
  ): Promise<RestoreResponse> {
    const { data } = await api.post(`/backups/${id}/restore`, {
      confirmation,
      createSafetyBackup,
    });
    return data.data || data;
  },

  /**
   * Télécharge une partie du backup (DB, FILES ou checksum).
   * Retourne un Blob — le composant client crée le lien de téléchargement.
   */
  async download(
    id: string,
    part: "db" | "files" | "checksum",
  ): Promise<Blob> {
    const { data } = await api.get(`/backups/${id}/download`, {
      params: { part },
      responseType: "blob",
    });
    return data;
  },

  /**
   * Récupère la configuration de la sauvegarde automatique.
   */
  async getSettings(): Promise<BackupSettings> {
    const { data } = await api.get("/backups/settings");
    return data.data || data;
  },

  /**
   * Met à jour la configuration.
   */
  async updateSettings(
    dto: BackupSettingsUpdate,
  ): Promise<BackupSettings> {
    const { data } = await api.patch("/backups/settings", dto);
    return data.data || data;
  },
};
