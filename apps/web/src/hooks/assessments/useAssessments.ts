import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assessmentsApi, AssessmentListFilters } from "@/api/assessments";
import { gradesApi } from "@/api/grades";
import { getErrorMessage } from "@/lib/axios";
import type { CreateAssessmentInput, GradeEntry } from "@/types/grades";

const KEY = "assessments";

export function useAssessments(filters: AssessmentListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => assessmentsApi.list(filters),
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => assessmentsApi.getById(id!),
    enabled: !!id,
  });
}

export function useAssessmentGrades(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "grades", assessmentId],
    queryFn: () => gradesApi.findByAssessment(assessmentId!),
    enabled: !!assessmentId,
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssessmentInput) => assessmentsApi.create(input),
    onSuccess: () => {
      toast.success("Evaluation creee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAssessmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "open" | "submit" | "validate" | "lock" | "reopen" }) => {
      return assessmentsApi[action](id);
    },
    onSuccess: () => {
      toast.success("Statut mis a jour");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSaveGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, grades }: { assessmentId: string; grades: GradeEntry[] }) =>
      gradesApi.bulkEntry(assessmentId, grades),
    onSuccess: () => {
      toast.success("Notes enregistrees");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
