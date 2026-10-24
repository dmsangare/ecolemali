import { api } from "@/lib/axios";
import type {
  ReportCard,
  GenerateReportCardsInput,
  UpdateReportCardInput,
  ClassRankingItem,
} from "@/types/report-cards";

export interface ReportCardFilters {
  page?: number;
  limit?: number;
  termId?: string;
  classId?: string;
  studentId?: string;
}

export const reportCardsApi = {
  async clearAbsences(id: string, motive: string): Promise<any> {
    const { data } = await api.patch(`/report-cards/${id}/clear-absences`, { motive });
    return data;
  },

  async list(filters: ReportCardFilters = {}): Promise<ReportCard[]> {
    const { data } = await api.get("/report-cards", { params: filters });
    return data.data || data;
  },

  async getById(id: string): Promise<ReportCard> {
    const { data } = await api.get(`/report-cards/${id}`);
    return data.data || data;
  },

  async getByStudent(studentId: string, termId: string): Promise<ReportCard> {
    const { data } = await api.get(
      `/report-cards/student/${studentId}/term/${termId}`,
    );
    return data.data || data;
  },

  async getClassRanking(classId: string, termId: string): Promise<ClassRankingItem[]> {
    const { data } = await api.get(
      `/report-cards/class/${classId}/term/${termId}/ranking`,
    );
    return data.data || data;
  },

  async generate(input: GenerateReportCardsInput): Promise<any> {
    const { data } = await api.post("/report-cards/generate", input);
    return data.data || data;
  },

  async update(id: string, input: UpdateReportCardInput): Promise<ReportCard> {
    const { data } = await api.patch(`/report-cards/${id}`, input);
    return data.data || data;
  },

  async validate(id: string): Promise<ReportCard> {
    const { data } = await api.post(`/report-cards/${id}/validate`);
    return data.data || data;
  },

  async publish(id: string): Promise<ReportCard> {
    const { data } = await api.post(`/report-cards/${id}/publish`);
    return data.data || data;
  },

  async publishByClass(classId: string, termId: string): Promise<any> {
    const { data } = await api.post(
      `/report-cards/class/${classId}/term/${termId}/publish`,
    );
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/report-cards/${id}`);
  },

  async exportPDF(id: string): Promise<Blob> {
    const { data } = await api.get(`/report-cards/${id}/export/pdf`, {
      responseType: "blob",
    });
    return data;
  },
};
