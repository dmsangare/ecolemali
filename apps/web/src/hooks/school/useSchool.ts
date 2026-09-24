import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";

export interface School {
  id: string;
  code: string;
  sigle: string | null;
  name: string;
  motto: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  directorName: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useSchool() {
  return useQuery({
    queryKey: ["school"],
    queryFn: async () => {
      // Le backend n'a PAS /schools/current
      // On utilise GET /schools et on prend le 1er
      const { data } = await api.get("/schools");
      const list = data.data || data;
      return (Array.isArray(list) ? list[0] : list) as School;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<School> }) => {
      const { data } = await api.patch(`/schools/${id}`, dto);
      return data.data || data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school"] });
      toast.success("Etablissement mis a jour");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la mise a jour");
    },
  });
}
