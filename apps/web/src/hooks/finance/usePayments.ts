import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentsApi } from "@/api/payments";
import { getErrorMessage } from "@/lib/axios";
import type { CreatePaymentInput } from "@/types/finance";

const KEY = "payments";

export function usePayments(filters: any = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => paymentsApi.list(filters),
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => paymentsApi.getById(id!),
    enabled: !!id,
  });
}

export function useTodayTotal() {
  return useQuery({
    queryKey: [KEY, "today-total"],
    queryFn: () => paymentsApi.getTodayTotal(),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => paymentsApi.create(input),
    onSuccess: () => {
      toast.success("Paiement enregistre");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCancelPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => paymentsApi.cancel(id, dto),
    onSuccess: () => {
      toast.success("Paiement annule");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
