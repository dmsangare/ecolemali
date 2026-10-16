import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  studentAccountsApi,
  type RefundInput,
  type ApplyCreditInput,
} from "@/api/studentAccounts";
import { getErrorMessage } from "@/lib/axios";

const KEY = "student-accounts";

export function useStudentAccount(studentId: string | undefined) {
  return useQuery({
    queryKey: [KEY, studentId],
    queryFn: () => studentAccountsApi.get(studentId!),
    enabled: !!studentId,
    staleTime: 30_000,
  });
}

export function useRefundCredit(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RefundInput) => studentAccountsApi.refund(studentId, input),
    onSuccess: (data) => {
      toast.success(`Rembourse : ${data.refunded} FCFA`);
      qc.invalidateQueries({ queryKey: [KEY, studentId] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useApplyCredit(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplyCreditInput) => studentAccountsApi.applyCredit(studentId, input),
    onSuccess: (data) => {
      toast.success(`Credit applique : ${data.applied} FCFA`);
      qc.invalidateQueries({ queryKey: [KEY, studentId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
