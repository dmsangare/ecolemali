import { api } from "@/lib/axios";
import type { Level, CreateLevelInput, UpdateLevelInput } from "@/types/level";

export const levelsApi = {
  async list(): Promise<Level[]> {
    const { data } = await api.get("/levels");
    return data.data || data;
  },

  async getById(id: string): Promise<Level> {
    const { data } = await api.get(`/levels/${id}`);
    return data.data || data;
  },

  async create(input: CreateLevelInput): Promise<Level> {
    const { data } = await api.post("/levels", input);
    return data.data || data;
  },

  async update(id: string, input: UpdateLevelInput): Promise<Level> {
    const { data } = await api.patch(`/levels/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/levels/${id}`);
  },
};
