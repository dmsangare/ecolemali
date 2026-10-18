import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  financeClosureApi,
  ExecuteFinanceClosureInput,
} from "@/api/finance-closure";
import { getErrorMessage } from "@/lib/axios";

const KEY = "finance-closure";
const KEY_AY = "academic-years";
const KEY_INV = "invoices";

/**
 * Recupere l'apercu de la clôture financiere pour une annee.
 */
export function useFinanceClosurePreview(yearId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "preview", yearId],
    queryFn: () => financeClosureApi.preview(yearId!),
    enabled: !!yearId,
    staleTime: 30_000,
  });
}

/**
 * Execute la clôture financiere (report des impayes/credits).
 */
export function useExecuteFinanceClosure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExecuteFinanceClosureInput) =>
      financeClosureApi.execute(input),
    onSuccess: (result) => {
      toast.success(
        `Cloture ${result.yearLabel} : ${result.carriedInvoicesCount} factures reportees`,
      );
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY_AY] });
      qc.invalidateQueries({ queryKey: [KEY_INV] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
