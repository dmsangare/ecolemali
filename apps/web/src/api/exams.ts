import { api } from "@/lib/axios";
import type { Exam, ExamSession, ExamCandidate } from "@/types/exams";

const unwrap = (res: any) => res.data?.data ?? res.data;

export interface ExamListFilters {
  page?: number;
  limit?: number;
  academicYearId?: string;
  termId?: string;
  type?: string;
  status?: string;
}

export const examsApi = {
  list: async (filters: ExamListFilters = {}): Promise<any> => {
    // Nettoyer les params vides : "" casse la validation du backend
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );
    const res = await api.get("/exams", { params: cleanParams });
    return res.data;
  },
  getById: async (id: string): Promise<Exam> => {
    const res = await api.get(`/exams/${id}`);
    return unwrap(res);
  },
  getResults: async (id: string): Promise<any> => {
    const res = await api.get(`/exams/${id}/results`);
    return unwrap(res);
  },
  create: async (input: any): Promise<Exam> => {
    const res = await api.post("/exams", input);
    return unwrap(res);
  },
  update: async (id: string, input: any): Promise<Exam> => {
    const res = await api.patch(`/exams/${id}`, input);
    return unwrap(res);
  },
  updateStatus: async (id: string, status: string): Promise<Exam> => {
    const res = await api.patch(`/exams/${id}/status`, { status });
    return unwrap(res);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },
  createSession: async (examId: string, dto: any): Promise<ExamSession> => {
    const res = await api.post(`/exams/${examId}/sessions`, dto);
    return unwrap(res);
  },
  getSession: async (sessionId: string): Promise<ExamSession> => {
    const res = await api.get(`/exams/sessions/${sessionId}`);
    return unwrap(res);
  },
  getCandidates: async (sessionId: string): Promise<ExamCandidate[]> => {
    const res = await api.get(`/exams/sessions/${sessionId}/candidates`);
    return unwrap(res);
  },
  generateCandidates: async (sessionId: string): Promise<any> => {
    const res = await api.post(`/exams/sessions/${sessionId}/generate-candidates`);
    return unwrap(res);
  },
  saveGrades: async (sessionId: string, grades: any[]): Promise<any> => {
    const res = await api.post(`/exams/sessions/${sessionId}/grades`, { grades });
    return unwrap(res);
  },
  removeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/exams/sessions/${sessionId}`);
  },
};
