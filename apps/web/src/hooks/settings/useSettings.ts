import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";

export interface SystemSettings {
  id?: string;
  currency: string;
  locale: string;
  timezone: string;
  gradingScale: number | string;
  passMark: number | string;
  academicYear?: string;
  matriculeFormat?: string;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get("/settings");
      return (data.data || data) as SystemSettings;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<SystemSettings>) => {
      const { data } = await api.patch("/settings", dto);
      return data.data || data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Parametres systeme mis a jour");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la mise a jour");
    },
  });
}
