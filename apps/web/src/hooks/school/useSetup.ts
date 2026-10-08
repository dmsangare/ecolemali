import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setupApi, PeriodsChoice, SetupStatus } from "@/api/setup";

const KEY = ["setup-status"];

export function useSetupStatus(schoolId: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, schoolId],
    queryFn: () => setupApi.getStatus(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000, // 1 minute
  });
}

export function useCreatePeriods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      schoolId,
      periods,
    }: {
      schoolId: string;
      periods: PeriodsChoice;
    }) => setupApi.createPeriods(schoolId, periods),
    onSuccess: (res) => {
      toast.success(`${res.created} periode(s) creee(s)`);
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["academic-years"] });
      qc.invalidateQueries({ queryKey: ["terms"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Erreur lors de la creation des periodes",
      );
    },
  });
}

export type { SetupStatus, PeriodsChoice };
