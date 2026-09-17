import { api } from "@/lib/axios";
import type { Teacher, CreateTeacherInput } from "@/types/teacher";

export interface TeacherListFilters {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
}

export interface PaginatedTeachers {
  data: Teacher[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export const teachersApi = {
  async list(filters: TeacherListFilters = {}): Promise<PaginatedTeachers> {
    const { data } = await api.get("/teachers", { params: filters });
    return data.data ? data : data;
  },

  async getById(id: string): Promise<Teacher> {
    const { data } = await api.get(`/teachers/${id}`);
    return data.data || data;
  },

  async create(input: CreateTeacherInput): Promise<Teacher> {
    const { data } = await api.post("/teachers", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateTeacherInput>): Promise<Teacher> {
    const { data } = await api.patch(`/teachers/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`);
  },

  async getAssignments(id: string): Promise<any[]> {
    const { data } = await api.get(`/teachers/${id}/assignments`);
    return data.data || data;
  },

  async getTimetable(id: string): Promise<any[]> {
    const { data } = await api.get(`/teachers/${id}/timetable`);
    return data.data || data;
  },
};
