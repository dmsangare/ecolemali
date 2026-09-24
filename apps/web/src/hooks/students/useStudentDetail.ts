import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@/api/students";
import type { StudentDetail } from "@/types/student";

const KEY = "students";

/**
 * Hook qui charge le detail complet d'un eleve avec toutes ses relations.
 */
export function useStudentDetail(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail-full", id],
    queryFn: async (): Promise<StudentDetail> => {
      const data = await studentsApi.getById(id!);
      return data as StudentDetail;
    },
    enabled: !!id,
    staleTime: 30_000, // 30 secondes
  });
}

/**
 * Hook pour charger le parcours d'un eleve.
 */
export function useStudentPathwayDetail(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "pathway", id],
    queryFn: () => studentsApi.getPathway(id!),
    enabled: !!id,
  });
}

/**
 * Hook pour charger les documents d'un eleve.
 */
export function useStudentDocuments(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "documents", id],
    queryFn: () => studentsApi.getDocuments(id!),
    enabled: !!id,
  });
}
