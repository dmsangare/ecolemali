import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectsApi, SubjectListFilters } from "@/api/subjects";
import { getErrorMessage } from "@/lib/axios";
import type { CreateSubjectInput } from "@/types/subject";

const KEY = "subjects";

export function useSubjects(filters: SubjectListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => subjectsApi.list(filters),
  });
}

export function useSubject(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => subjectsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) => subjectsApi.create(input),
    onSuccess: () => {
      toast.success("Matiere creee avec succes");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.remove(id),
    onSuccess: () => {
      toast.success("Matiere supprimee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
