import { api } from "@/lib/axios";

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
  async getDashboard(academicYearId?: string): Promise<DashboardStats> {
    const { data } = await api.get("/reports/dashboard", {
      params: { academicYearId },
    });
    return data.data || data;
  },
};
