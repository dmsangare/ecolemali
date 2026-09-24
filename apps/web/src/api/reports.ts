import { api } from "@/lib/axios";

const unwrap = (res: any) => res.data?.data ?? res.data;

export interface DashboardStats {
  studentsCount: number;
  teachersCount: number;
  classesCount: number;
  attendanceRate: number;
  unpaidAmount: number;
  revenueAmount: number;
  totalBilled: number;
  genderSplit: { boys: number; girls: number };
}

export const reportsApi = {
  dashboard: async (academicYearId?: string): Promise<DashboardStats> => {
    const res = await api.get("/reports/dashboard", { params: { academicYearId } });
    return unwrap(res);
  },
  financial: async (academicYearId?: string) => {
    const res = await api.get("/reports/financial", { params: { academicYearId } });
    return unwrap(res);
  },
  unpaid: async (classId?: string) => {
    const res = await api.get("/reports/unpaid", { params: { classId } });
    return unwrap(res);
  },
  students: async (academicYearId?: string) => {
    const res = await api.get("/reports/students", { params: { academicYearId } });
    return unwrap(res);
  },
  pedagogical: async (termId?: string) => {
    const res = await api.get("/reports/pedagogical", { params: { termId } });
    return unwrap(res);
  },
  attendance: async (classId?: string, termId?: string) => {
    const res = await api.get("/reports/attendance", { params: { classId, termId } });
    return unwrap(res);
  },
  classes: async () => {
    const res = await api.get("/reports/classes");
    return unwrap(res);
  },
  monthly: async () => {
    const res = await api.get("/reports/monthly");
    return unwrap(res);
  },
};
