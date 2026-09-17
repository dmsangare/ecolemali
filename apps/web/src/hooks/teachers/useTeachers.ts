import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teachersApi, TeacherListFilters } from "@/api/teachers";
import { getErrorMessage } from "@/lib/axios";
import type { CreateTeacherInput } from "@/types/teacher";

const KEY = "teachers";

export function useTeachers(filters: TeacherListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => teachersApi.list(filters),
  });
}

export function useTeacher(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => teachersApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeacherInput) => teachersApi.create(input),
    onSuccess: () => {
      toast.success("Enseignant cree avec succes");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teachersApi.remove(id),
    onSuccess: () => {
      toast.success("Enseignant supprime");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
