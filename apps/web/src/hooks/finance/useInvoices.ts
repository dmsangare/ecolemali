import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoicesApi } from "@/api/invoices";
import { getErrorMessage } from "@/lib/axios";

const KEY = "invoices";

export function useInvoices(filters: any = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => invoicesApi.list(filters),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => invoicesApi.getById(id!),
    enabled: !!id,
  });
}

export function useFinanceDashboard(academicYearId?: string) {
  return useQuery({
    queryKey: [KEY, "dashboard", academicYearId],
    queryFn: () => invoicesApi.getDashboard(academicYearId),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => invoicesApi.create(input),
    onSuccess: () => {
      toast.success("Facture creee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => invoicesApi.cancel(id, dto),
    onSuccess: () => {
      toast.success("Facture annulee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
