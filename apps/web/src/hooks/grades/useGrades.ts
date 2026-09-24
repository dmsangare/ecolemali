import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradesApi } from "@/api/grades";
import { getErrorMessage } from "@/lib/axios";
import type { GradeEntry } from "@/types/grades";

const KEY = "grades";

export function useAssessmentGrades(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "assessment", assessmentId],
    queryFn: () => gradesApi.findByAssessment(assessmentId!),
    enabled: !!assessmentId,
  });
}

export function useAssessmentStats(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "stats", assessmentId],
    queryFn: () => gradesApi.getStats(assessmentId!),
    enabled: !!assessmentId,
  });
}

export function useBulkSaveGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      grades,
    }: {
      assessmentId: string;
      grades: GradeEntry[];
    }) => gradesApi.bulkEntry(assessmentId, grades),
    onSuccess: (_, variables) => {
      toast.success("Notes enregistrees");
      qc.invalidateQueries({ queryKey: [KEY, "assessment", variables.assessmentId] });
      qc.invalidateQueries({ queryKey: [KEY, "stats", variables.assessmentId] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
