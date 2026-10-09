import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsApi, Settings, AppearanceSettings, TemplatesSettings, ThresholdsSettings, FinanceSettings } from "@/api/settings";
import { useAuth } from "@/contexts/AuthContext";

const KEY = ["settings"];

export function useSettings() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => settingsApi.get(),
    // Ne lancer la requete que quand l'utilisateur est authentifie
    // et a une ecole associee
    enabled: isAuthenticated && !!user?.schoolId,
    staleTime: 5 * 60_000,
    // Toujours refetch au montage pour ne pas garder un cache negatif
    refetchOnMount: "always",
    retry: 1,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Settings>) => settingsApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Parametres mis a jour");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Erreur lors de la mise a jour",
      );
    },
  });
}

export function useUpdateAppearance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appearance: AppearanceSettings) =>
      settingsApi.updateAppearance(appearance),
    onSuccess: () => {
      // Forcer un refetch complet (enlever le cache puis invalider)
      qc.setQueryData(KEY, undefined as any);
      qc.invalidateQueries({ queryKey: KEY, refetchType: "all" });
      toast.success("Apparence mise a jour");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Erreur lors de la mise a jour",
      );
    },
  });
}

export type { Settings, AppearanceSettings };

export function useUpdateTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templates: Partial<TemplatesSettings>) =>
      settingsApi.updateTemplates(templates),
    onSuccess: () => {
      qc.setQueryData(KEY, undefined as any);
      qc.invalidateQueries({ queryKey: KEY, refetchType: "all" });
      toast.success("Templates mis a jour");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Erreur lors de la mise a jour",
      );
    },
  });
}

export type { TemplatesSettings };

export function useUpdateThresholds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (thresholds: Partial<ThresholdsSettings>) =>
      settingsApi.updateThresholds(thresholds),
    onSuccess: () => {
      qc.setQueryData(KEY, undefined as any);
      qc.invalidateQueries({ queryKey: KEY, refetchType: "all" });
      toast.success("Seuils mis a jour");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Erreur lors de la mise a jour",
      );
    },
  });
}

export type { ThresholdsSettings };

export function useUpdateFinance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (finance: Partial<FinanceSettings>) =>
      settingsApi.updateFinance(finance),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
