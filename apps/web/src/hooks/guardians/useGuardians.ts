import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/axios";

const KEY = "guardians";

export interface Guardian {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  profession?: string | null;
  relationType: "FATHER" | "MOTHER" | "TUTOR" | "OTHER";
  gender?: "M" | "F" | null;
}

export interface CreateGuardianInput {
  schoolId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  profession?: string;
  relationType: "FATHER" | "MOTHER" | "TUTOR" | "OTHER";
  gender?: "M" | "F";
}

export function useGuardiansSearch(q: string) {
  return useQuery({
    queryKey: [KEY, "search", q],
    queryFn: async () => {
      if (!q || q.length < 2) return [];
      const { data } = await api.get("/guardians", { params: { q, limit: 10 } });
      return (data.data?.data || data.data || []) as Guardian[];
    },
    enabled: q.length >= 2,
  });
}

export function useCreateGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGuardianInput) => {
      const { data } = await api.post("/guardians", input);
      return (data.data || data) as Guardian;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useLinkGuardianToStudent() {
  return useMutation({
    mutationFn: async ({
      guardianId,
      studentId,
      isPrimary,
    }: {
      guardianId: string;
      studentId: string;
      isPrimary: boolean;
    }) => {
      const { data } = await api.post(
        `/guardians/${guardianId}/students/${studentId}`,
        { isPrimary },
      );
      return data.data || data;
    },
  });
}

export function useAvailableGuardians() {
  return useQuery({
    queryKey: ["guardians", "available"],
    queryFn: async () => {
      const { data } = await api.get("/guardians/available");
      return (data.data || data) as Array<{
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        email: string | null;
        relationType: string;
      }>;
    },
    staleTime: 60_000,
  });
}
