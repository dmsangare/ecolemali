import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rolesApi } from "@/api/roles";

const QUERY_KEYS = {
  list: () => ["roles", "list"] as const,
  permissions: () => ["roles", "permissions"] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
};

/**
 * Liste tous les roles.
 */
export function useRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => rolesApi.list(),
    staleTime: 60_000,
  });
}

/**
 * Liste toutes les permissions groupees par module.
 */
export function usePermissions() {
  return useQuery({
    queryKey: QUERY_KEYS.permissions(),
    queryFn: () => rolesApi.listPermissions(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Detail d'un role avec ses permissions.
 */
export function useRole(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id || ""),
    queryFn: () => rolesApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Créer un role.
 */
export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { code: string; name: string; description?: string }) =>
      rolesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role cree avec succes");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la creation");
    },
  });
}

/**
 * Modifier un role.
 */
export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: { name?: string; description?: string };
    }) => rolesApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role modifie");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la modification");
    },
  });
}

/**
 * Remplacer toutes les permissions d'un role.
 */
export function useSetPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      permissionIds,
    }: {
      id: string;
      permissionIds: string[];
    }) => rolesApi.setPermissions(id, permissionIds),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["roles", "detail", variables.id] });
      toast.success("Permissions mises a jour");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Erreur lors de la mise a jour",
      );
    },
  });
}

/**
 * Supprimer un role.
 */
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role supprime");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de la suppression");
    },
  });
}
