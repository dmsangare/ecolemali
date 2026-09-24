import { api } from "@/lib/axios";

export interface Enrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  levelId: string;
  enrollmentDate: string;
  status: string;
  createdAt: string;
  student?: any;
}

export interface CreateEnrollmentInput {
  studentId: string;
  academicYearId: string;
  classId: string;
  levelId: string;
  enrollmentDate?: string;
  status?: string;
  previousSchool?: string;
  notes?: string;
}

export const enrollmentsApi = {
  async list(params?: { classId?: string; studentId?: string; academicYearId?: string }): Promise<Enrollment[]> {
    const { data } = await api.get("/enrollments", { params });
    return data.data || data;
  },

  async getById(id: string): Promise<Enrollment> {
    const { data } = await api.get(`/enrollments/${id}`);
    return data.data || data;
  },

  async create(input: CreateEnrollmentInput): Promise<Enrollment> {
    const { data } = await api.post("/enrollments", input);
    return data.data || data;
  },

  async cancel(id: string, reason?: string): Promise<Enrollment> {
    const { data } = await api.post(`/enrollments/${id}/cancel`, { reason });
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/enrollments/${id}`);
  },
};
