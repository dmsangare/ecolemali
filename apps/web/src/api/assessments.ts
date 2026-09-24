import { api } from "@/lib/axios";
import type { Assessment, CreateAssessmentInput } from "@/types/grades";

export interface AssessmentListFilters {
  page?: number;
  limit?: number;
  classId?: string;
  subjectId?: string;
  termId?: string;
  teacherId?: string;
  status?: string;
}

export const assessmentsApi = {
  async list(filters: AssessmentListFilters = {}): Promise<any> {
    const { data } = await api.get("/assessments", { params: filters });
    return data.data ? data : data;
  },

  async getById(id: string): Promise<Assessment> {
    const { data } = await api.get(`/assessments/${id}`);
    return data.data || data;
  },

  async create(input: CreateAssessmentInput): Promise<Assessment> {
    const { data } = await api.post("/assessments", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateAssessmentInput>): Promise<Assessment> {
    const { data } = await api.patch(`/assessments/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/assessments/${id}`);
  },

  async open(id: string): Promise<Assessment> {
    const { data } = await api.post(`/assessments/${id}/open`);
    return data.data || data;
  },

  async submit(id: string): Promise<Assessment> {
    const { data } = await api.post(`/assessments/${id}/submit`);
    return data.data || data;
  },

  async validate(id: string): Promise<Assessment> {
    const { data } = await api.post(`/assessments/${id}/validate`);
    return data.data || data;
  },

  async lock(id: string): Promise<Assessment> {
    const { data } = await api.post(`/assessments/${id}/lock`);
    return data.data || data;
  },

  async reopen(id: string): Promise<Assessment> {
    const { data } = await api.post(`/assessments/${id}/reopen`);
    return data.data || data;
  },
};
