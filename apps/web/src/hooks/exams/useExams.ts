import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { examsApi, ExamListFilters } from "@/api/exams";
import { getErrorMessage } from "@/lib/axios";

const KEY = "exams";

export function useExams(filters: ExamListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => examsApi.list(filters),
  });
}

export function useExam(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => examsApi.getById(id!),
    enabled: !!id,
  });
}

export function useExamResults(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "results", id],
    queryFn: () => examsApi.getResults(id!),
    enabled: !!id,
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsApi.remove(id),
    onSuccess: () => {
      toast.success("Examen supprime");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
