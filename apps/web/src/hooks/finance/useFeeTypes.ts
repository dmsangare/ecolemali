import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { feeTypesApi, type FeeTypeFilters } from "@/api/fee-types";
import { getErrorMessage } from "@/lib/axios";
import type { CreateFeeTypeInput } from "@/types/finance";

const KEY = "fee-types";

export function useFeeTypes(filters: FeeTypeFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => feeTypesApi.list(filters),
    staleTime: 5 * 60_000,
  });
}

export function useCreateFeeType() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: CreateFeeTypeInput) => {
      const payload = {
        ...input,
        schoolId: (input as any).schoolId || user?.schoolId,
      };
      return feeTypesApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Type de frais créé");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateFeeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateFeeTypeInput> }) =>
      feeTypesApi.update(id, input),
    onSuccess: () => {
      toast.success("Type de frais mis à jour");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteFeeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeTypesApi.remove(id),
    onSuccess: () => {
      toast.success("Type de frais supprimé");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
