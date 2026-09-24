import { api } from "@/lib/axios";

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissionsCount: number;
  usersCount: number;
}

export interface Permission {
  id: string;
  code: string;
  action: string;
  description: string | null;
}

export interface RoleDetail extends Omit<Role, "permissionsCount"> {
  permissions: string[];
  permissionsByModule: Record<string, Permission[]>;
}

export interface PermissionsByModule {
  total: number;
  modules: Record<string, Permission[]>;
}

export const rolesApi = {
  async list(): Promise<Role[]> {
    const { data } = await api.get("/roles");
    return data.data || data;
  },

  async listPermissions(): Promise<PermissionsByModule> {
    const { data } = await api.get("/roles/permissions");
    return data.data || data;
  },

  async getById(id: string): Promise<RoleDetail> {
    const { data } = await api.get(`/roles/${id}`);
    return data.data || data;
  },

  async create(dto: {
    code: string;
    name: string;
    description?: string;
  }): Promise<Role> {
    const { data } = await api.post("/roles", dto);
    return data.data || data;
  },

  async update(
    id: string,
    dto: { name?: string; description?: string },
  ): Promise<Role> {
    const { data } = await api.patch(`/roles/${id}`, dto);
    return data.data || data;
  },

  async setPermissions(id: string, permissionIds: string[]): Promise<RoleDetail> {
    const { data } = await api.put(`/roles/${id}/permissions`, {
      permissionIds,
    });
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  },
};
