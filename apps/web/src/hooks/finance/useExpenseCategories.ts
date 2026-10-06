import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { expenseCategoriesApi } from "@/api/expense-categories";
import type {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from "@/api/expense-categories";
import { getErrorMessage } from "@/lib/axios";

const KEY = "expense-categories";

export function useExpenseCategories() {
  return useQuery({
    queryKey: [KEY, "list"],
    queryFn: () => expenseCategoriesApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useExpenseCategory(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => expenseCategoriesApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseCategoryInput) =>
      expenseCategoriesApi.create(input),
    onSuccess: () => {
      toast.success("Categorie creee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateExpenseCategoryInput;
    }) => expenseCategoriesApi.update(id, input),
    onSuccess: () => {
      toast.success("Categorie mise a jour");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseCategoriesApi.remove(id),
    onSuccess: () => {
      toast.success("Categorie supprimee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
