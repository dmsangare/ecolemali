import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import { useSchool } from "@/hooks/school/useSchool";
import { toast } from "sonner";
import { usersApi } from "@/api/users";
import type { CreateUserDto, UpdateUserDto } from "@/types/user";

const QUERY_KEYS = {
  list: (params?: any) => ["users", "list", params] as const,
  roles: () => ["users", "roles"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsers(params?: { page?: number; limit?: number; q?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => usersApi.list(params),
    staleTime: 30_000,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.roles(),
    queryFn: () => usersApi.listRoles(),
    staleTime: 5 * 60_000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: defaultSchool } = useSchool();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => {
      // Priorite du schoolId :
      // 1. Celui envoye explicitement par le formulaire (multi-ecoles)
      // 2. Celui de l'utilisateur connecte (DIRECTOR, SECRETARY)
      // 3. L'ecole par defaut (SUPER_ADMIN avec une seule ecole)
      const schoolId =
        (dto as any).schoolId ||
        user?.schoolId ||
        (defaultSchool as any)?.id ||
        undefined;
      const payload = { ...dto, schoolId };
      return usersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "list"] });
      toast.success("Utilisateur cree avec succes");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la creation");
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      usersApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur modifie");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la modification");
    },
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersApi.resetPassword(id, newPassword),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Mot de passe reinitialise");
    },
    onError: () => toast.error("Erreur lors de la reinitialisation"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "list"] });
      toast.success("Utilisateur supprime");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la suppression");
    },
  });
}
