import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { levelsApi } from "@/api/levels";
import { getErrorMessage } from "@/lib/axios";
import type { CreateLevelInput, UpdateLevelInput } from "@/types/level";

const KEY = "levels";

export function useLevels() {
  return useQuery({
    queryKey: [KEY, "list"],
    queryFn: () => levelsApi.list(),
  });
}

export function useCreateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLevelInput) => levelsApi.create(input),
    onSuccess: () => {
      toast.success("Niveau cree avec succes");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLevelInput }) =>
      levelsApi.update(id, dto),
    onSuccess: () => {
      toast.success("Niveau mis a jour");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => levelsApi.remove(id),
    onSuccess: () => {
      toast.success("Niveau supprime");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
