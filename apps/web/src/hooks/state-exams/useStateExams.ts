import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stateExamsApi, SaveStateExamResultsInput } from "@/api/state-exams";
import { getErrorMessage } from "@/lib/axios";

const KEY = "state-exams";

export function useStateExamLevels() {
  return useQuery({
    queryKey: [KEY, "levels"],
    queryFn: () => stateExamsApi.listLevels(),
    staleTime: 5 * 60_000,
  });
}

export function useStateExamCandidates(
  levelId: string | undefined,
  academicYearId: string | undefined,
) {
  return useQuery({
    queryKey: [KEY, "candidates", levelId, academicYearId],
    queryFn: () => stateExamsApi.listCandidates(levelId!, academicYearId!),
    enabled: !!levelId && !!academicYearId,
    staleTime: 30_000,
  });
}

export function useSaveStateExamResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveStateExamResultsInput) =>
      stateExamsApi.saveResults(input),
    onSuccess: (result) => {
      toast.success(
        `Résultats enregistrés : ${result.saved} élève(s) (${result.skipped} ignoré(s))`,
      );
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
