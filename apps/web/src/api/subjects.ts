import { api } from "@/lib/axios";
import type { Subject, CreateSubjectInput } from "@/types/subject";

export interface SubjectListFilters {
  q?: string;
  type?: string;
}

export const subjectsApi = {
  async list(filters: SubjectListFilters = {}): Promise<Subject[]> {
    const { data } = await api.get("/subjects", { params: filters });
    return data.data || data;
  },

  async getById(id: string): Promise<Subject> {
    const { data } = await api.get(`/subjects/${id}`);
    return data.data || data;
  },

  async create(input: CreateSubjectInput): Promise<Subject> {
    const { data } = await api.post("/subjects", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateSubjectInput>): Promise<Subject> {
    const { data } = await api.patch(`/subjects/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/subjects/${id}`);
  },

  async setCoefficient(id: string, levelId: string, coefficient: number, weeklyHours?: number): Promise<any> {
    const { data } = await api.post(`/subjects/${id}/coefficients`, {
      levelId,
      coefficient,
      weeklyHours,
    });
    return data.data || data;
  },
};
