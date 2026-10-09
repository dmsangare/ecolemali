import { api } from "@/lib/axios";
import type {
  User,
  Role,
  CreateUserDto,
  UpdateUserDto,
  UsersListResponse,
} from "@/types/user";

export const usersApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<UsersListResponse> {
    const { data } = await api.get("/users", { params });
    return data.data ? data : data;
  },

  async listRoles(): Promise<Role[]> {
    const { data } = await api.get("/users/roles");
    return data.data || data;
  },

  async getById(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data.data || data;
  },

  async create(dto: CreateUserDto): Promise<{ user: User; provisionalPassword: string }> {
    const { data } = await api.post("/users", dto);
    return data.data || data;
  },

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const { data } = await api.patch(`/users/${id}`, dto);
    return data.data || data;
  },

  async resetPassword(id: string): Promise<{ user: User; provisionalPassword: string }> {
    const { data } = await api.post(`/users/${id}/reset-password`);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
