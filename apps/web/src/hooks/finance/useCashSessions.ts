import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cashSessionsApi } from "@/api/cash-sessions";
import { getErrorMessage } from "@/lib/axios";

const KEY = "cash-sessions";

export function useCashSessions(filters: any = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => cashSessionsApi.list(filters),
  });
}

export function useCurrentCashSession() {
  return useQuery({
    queryKey: [KEY, "current"],
    queryFn: () => cashSessionsApi.getCurrent(),
  });
}

export function useCashSession(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => cashSessionsApi.getById(id!),
    enabled: !!id,
  });
}

export function useOpenCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => cashSessionsApi.open(input),
    onSuccess: () => {
      toast.success("Caisse ouverte");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCloseCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) =>
      cashSessionsApi.close(id, dto),
    onSuccess: () => {
      toast.success("Caisse cloturee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
