import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface Sibling {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthDate: string;
  status: string;
  enrollments?: Array<{
    class?: { id: string; code: string; name: string } | null;
    level?: { id: string; code: string; name: string } | null;
  }>;
}

/**
 * Hook qui cherche les freres/soeurs d'un eleve
 * (autres eleves partageant au moins un tuteur).
 */
export function useSiblings(studentId: string | undefined) {
  return useQuery({
    queryKey: ["students", "siblings", studentId],
    queryFn: async (): Promise<Sibling[]> => {
      const { data } = await api.get(`/students/${studentId}/siblings`);
      return data.data || data;
    },
    enabled: !!studentId,
  });
}
