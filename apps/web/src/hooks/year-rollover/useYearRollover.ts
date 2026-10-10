import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  yearRolloverApi,
  PreviewYearRolloverInput,
  ExecuteYearRolloverInput,
} from "@/api/year-rollover";
import { getErrorMessage } from "@/lib/axios";

const KEY = "year-rollover";
const KEY_AY = "academic-years";

/**
 * Mutation pour obtenir un apercu du passage (aucune ecriture).
 * On utilise useMutation (pas useQuery) car c'est un POST avec body.
 */
export function useYearRolloverPreview() {
  return useMutation({
    mutationFn: (input: PreviewYearRolloverInput) =>
      yearRolloverApi.preview(input),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

/**
 * Mutation pour executer le passage (creation de l'annee N+1).
 */
export function useYearRolloverExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExecuteYearRolloverInput) =>
      yearRolloverApi.execute(input),
    onSuccess: (result) => {
      toast.success(
        `Annee ${result.newYearLabel} creee (${result.enrollmentsCreated} eleves inscrits)`,
      );
      // Rafraichir les listes d'annees + classes + eleves
      qc.invalidateQueries({ queryKey: [KEY_AY] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
