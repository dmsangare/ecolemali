import { api } from "@/lib/axios";

export type AcademicYearStatus = "PREPARATION" | "ACTIVE" | "CLOTUREE" | "ARCHIVEE";

export interface AcademicYear {
  id: string;
  schoolId: string;
  label: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  isCurrent: boolean;
  closedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    classes: number;
    enrollments: number;
    terms: number;
  };
}

export interface ClosingSummary {
  year: {
    id: string;
    label: string;
    status: AcademicYearStatus;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  };
  totalStudents: number;
  totalClasses: number;
  pendingEnrollments: number;
  unpaidInvoices: number;
  openCashSessions: number;
  draftReportCards: number;
  blockers: Array<{ type: string; count: number; label: string; severity: string }>;
  warnings: Array<{ type: string; count: number; label: string }>;
  canClose: boolean;
}

export const academicYearsApi = {
  async list(): Promise<AcademicYear[]> {
    const { data } = await api.get("/academic-years");
    return data.data || data;
  },

  async getById(id: string): Promise<AcademicYear> {
    const { data } = await api.get(`/academic-years/${id}`);
    return data.data || data;
  },

  async create(payload: {
    schoolId?: string;
    label: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
  }): Promise<AcademicYear> {
    const { data } = await api.post("/academic-years", payload);
    return data.data || data;
  },

  async activate(id: string): Promise<AcademicYear> {
    const { data } = await api.post(`/academic-years/${id}/activate`);
    return data.data || data;
  },

  async getClosingSummary(id: string): Promise<ClosingSummary> {
    const { data } = await api.get(`/academic-years/${id}/closing-summary`);
    return data.data || data;
  },

  async close(id: string): Promise<AcademicYear> {
    const { data } = await api.post(`/academic-years/${id}/close`);
    return data.data || data;
  },

  async archive(id: string): Promise<AcademicYear> {
    const { data } = await api.post(`/academic-years/${id}/archive`);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/academic-years/${id}`);
  },
};
