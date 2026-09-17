import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoicesApi, InvoiceListFilters } from "@/api/invoices";
import { paymentsApi, PaymentListFilters } from "@/api/payments";
import { cashSessionsApi } from "@/api/cash-sessions";
import { getErrorMessage } from "@/lib/axios";
import type { CreatePaymentInput } from "@/types/finance";

const INV_KEY = "invoices";
const PAY_KEY = "payments";
const CASH_KEY = "cash-sessions";

export function useInvoices(filters: InvoiceListFilters = {}) {
  return useQuery({
    queryKey: [INV_KEY, "list", filters],
    queryFn: () => invoicesApi.list(filters),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [INV_KEY, "detail", id],
    queryFn: () => invoicesApi.getById(id!),
    enabled: !!id,
  });
}

export function useFinanceDashboard(academicYearId?: string) {
  return useQuery({
    queryKey: [INV_KEY, "dashboard", academicYearId],
    queryFn: () => invoicesApi.getDashboard(academicYearId),
  });
}

export function usePayments(filters: PaymentListFilters = {}) {
  return useQuery({
    queryKey: [PAY_KEY, "list", filters],
    queryFn: () => paymentsApi.list(filters),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => paymentsApi.create(input),
    onSuccess: () => {
      toast.success("Paiement enregistre");
      qc.invalidateQueries({ queryKey: [PAY_KEY] });
      qc.invalidateQueries({ queryKey: [INV_KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      paymentsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Paiement annule");
      qc.invalidateQueries({ queryKey: [PAY_KEY] });
      qc.invalidateQueries({ queryKey: [INV_KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCashSessions(filters: any = {}) {
  return useQuery({
    queryKey: [CASH_KEY, "list", filters],
    queryFn: () => cashSessionsApi.list(filters),
  });
}

export function useCurrentCashSession() {
  return useQuery({
    queryKey: [CASH_KEY, "current"],
    queryFn: () => cashSessionsApi.getCurrent(),
  });
}

export function useOpenCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => cashSessionsApi.open(input),
    onSuccess: () => {
      toast.success("Caisse ouverte");
      qc.invalidateQueries({ queryKey: [CASH_KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCloseCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, closingAmount }: { id: string; closingAmount: number }) =>
      cashSessionsApi.close(id, closingAmount),
    onSuccess: () => {
      toast.success("Caisse fermee");
      qc.invalidateQueries({ queryKey: [CASH_KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
