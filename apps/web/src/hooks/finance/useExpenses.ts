import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { expensesApi } from "@/api/expenses";
import { getErrorMessage } from "@/lib/axios";
import type { CreateExpenseInput, ExpenseFilters } from "@/types/finance";

const KEY = "expenses";

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => expensesApi.list(filters),
    staleTime: 60_000,
  });
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => expensesApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => {
      const payload = {
        ...input,
        schoolId: (input as any).schoolId || user?.schoolId,
      };
      return expensesApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Depense enregistree");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["cash-sessions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateExpenseInput>;
    }) => expensesApi.update(id, input),
    onSuccess: () => {
      toast.success("Depense mise a jour");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["cash-sessions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => {
      toast.success("Depense supprimee");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["cash-sessions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
