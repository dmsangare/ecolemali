import { api } from "@/lib/axios";
import type { Exam } from "@/types/exams";

export interface ExamListFilters {
  page?: number;
  limit?: number;
  academicYearId?: string;
  termId?: string;
  type?: string;
  status?: string;
}

export const examsApi = {
  async list(filters: ExamListFilters = {}): Promise<any> {
    const { data } = await api.get("/exams", { params: filters });
    return data.data ? data : data;
  },

  async getById(id: string): Promise<Exam> {
    const { data } = await api.get(`/exams/${id}`);
    return data.data || data;
  },

  async getResults(id: string): Promise<any> {
    const { data } = await api.get(`/exams/${id}/results`);
    return data.data || data;
  },

  async create(input: any): Promise<Exam> {
    const { data } = await api.post("/exams", input);
    return data.data || data;
  },

  async update(id: string, input: any): Promise<Exam> {
    const { data } = await api.patch(`/exams/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/exams/${id}`);
  },
};
