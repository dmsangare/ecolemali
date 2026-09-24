import { api } from "@/lib/axios";
import type { Teacher, CreateTeacherInput } from "@/types/teacher";

export interface TeacherListFilters {
  page?: number;
  limit?: number;
  q?: string;
}

export interface TeacherListResponse {
  data: Teacher[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export const teachersApi = {
  list: async (params?: TeacherListFilters): Promise<TeacherListResponse> => {
    const res = await api.get('/teachers', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/teachers/${id}`);
    return res.data?.data ?? res.data;
  },
  create: async (input: CreateTeacherInput) => {
    const res = await api.post('/teachers', input);
    return res.data?.data ?? res.data;
  },
  update: async (id: string, dto: any) => {
    const res = await api.patch(`/teachers/${id}`, dto);
    return res.data?.data ?? res.data;
  },
  remove: async (id: string) => {
    const res = await api.delete(`/teachers/${id}`);
    return res.data?.data ?? res.data;
  },
  assign: async (id: string, dto: any) => {
    const res = await api.post(`/teachers/${id}/assign`, dto);
    return res.data?.data ?? res.data;
  },
  removeAssignment: async (id: string, assignmentId: string) => {
    const res = await api.delete(`/teachers/${id}/assign/${assignmentId}`);
    return res.data?.data ?? res.data;
  },
};
