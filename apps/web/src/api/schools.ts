import { api } from "@/lib/axios";
import type { School, UpdateSchoolInput, SystemSettings } from "@/types/school";

export const schoolsApi = {
  async list(): Promise<School[]> {
    const { data } = await api.get("/schools");
    return data.data || data;
  },

  async getById(id: string): Promise<School> {
    const { data } = await api.get(`/schools/${id}`);
    return data.data || data;
  },

  async update(id: string, input: UpdateSchoolInput): Promise<School> {
    const { data } = await api.patch(`/schools/${id}`, input);
    return data.data || data;
  },
};

export const settingsApi = {
  async get(): Promise<SystemSettings> {
    const { data } = await api.get("/settings");
    return data.data || data;
  },

  async update(input: Partial<SystemSettings>): Promise<SystemSettings> {
    const { data } = await api.patch("/settings", input);
    return data.data || data;
  },
};
