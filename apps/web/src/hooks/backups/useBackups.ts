import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { backupsApi, BackupSettingsUpdate } from "@/api/backups";
import { getErrorMessage } from "@/lib/axios";

const KEY = "backups";

// ============================================================
// LECTURE
// ============================================================

/**
 * Liste paginée des sauvegardes.
 */
export function useBackups(
  filters: { page?: number; limit?: number; type?: string } = {},
) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => backupsApi.list(filters),
    staleTime: 30_000,
  });
}

/**
 * Détail d'une sauvegarde.
 */
export function useBackup(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => backupsApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Configuration de la sauvegarde automatique.
 */
export function useBackupSettings() {
  return useQuery({
    queryKey: [KEY, "settings"],
    queryFn: () => backupsApi.getSettings(),
    staleTime: 5 * 60_000,
  });
}

// ============================================================
// ÉCRITURE
// ============================================================

/**
 * Crée une sauvegarde complète (DB + documents).
 */
export function useCreateBackup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => backupsApi.createFull(),
    onSuccess: (data) => {
      toast.success("Sauvegarde créée avec succès", {
        description: `Taille : ${formatBytes(data.sizeBytes || 0)}`,
      });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Supprime une sauvegarde.
 */
export function useDeleteBackup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => backupsApi.remove(id),
    onSuccess: () => {
      toast.success("Sauvegarde supprimée");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Restaure une sauvegarde.
 * ⚠️ Pas de toast automatique — c'est l'appelant qui gère (opération critique).
 */
export function useRestoreBackup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      confirmation,
      createSafetyBackup,
    }: {
      id: string;
      confirmation: string;
      createSafetyBackup?: boolean;
    }) => backupsApi.restore(id, confirmation, createSafetyBackup),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Met à jour la configuration de la sauvegarde automatique.
 */
export function useUpdateBackupSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: BackupSettingsUpdate) =>
      backupsApi.updateSettings(dto),
    onSuccess: () => {
      toast.success("Configuration mise à jour");
      qc.invalidateQueries({ queryKey: [KEY, "settings"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ============================================================
// TÉLÉCHARGEMENT
// ============================================================

/**
 * Télécharge un backup (retourne un Blob).
 * Le composant client crée le lien de téléchargement.
 */
export function useDownloadBackup() {
  return useMutation({
    mutationFn: ({
      id,
      part,
    }: {
      id: string;
      part: "db" | "files" | "checksum";
    }) => backupsApi.download(id, part),
    onSuccess: () => {
      toast.success("Téléchargement démarré");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ============================================================
// HELPERS
// ============================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
