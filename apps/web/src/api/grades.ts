import { api } from "@/lib/axios";
import type { AssessmentGrades, GradeEntry } from "@/types/grades";

export const gradesApi = {
  async findByAssessment(assessmentId: string): Promise<AssessmentGrades> {
    const { data } = await api.get(`/grades/assessment/${assessmentId}`);
    return data.data || data;
  },

  async getStats(assessmentId: string): Promise<any> {
    const { data } = await api.get(`/grades/assessment/${assessmentId}/stats`);
    return data.data || data;
  },

  async bulkEntry(assessmentId: string, grades: GradeEntry[]): Promise<any> {
    const { data } = await api.post("/grades/bulk", { assessmentId, grades });
    return data.data || data;
  },

  async update(id: string, dto: any): Promise<any> {
    const { data } = await api.patch(`/grades/${id}`, dto);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/grades/${id}`);
  },
};
