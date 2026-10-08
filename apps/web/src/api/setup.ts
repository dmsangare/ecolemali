import { api } from "@/lib/axios";

export interface SetupStatus {
  schoolId: string;
  academicYear: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
  } | null;
  counts: {
    levels: number;
    classes: number;
    subjects: number;
    users: number;
    students: number;
    trimestres: number;
    mois: number;
  };
  steps: {
    schoolInfo: boolean;
    academicYear: boolean;
    periods: boolean;
    levels: boolean;
    classes: boolean;
    subjects: boolean;
    users: boolean;
    students: boolean;
  };
  completed: number;
  total: number;
  isConfigured: boolean;
}

export type PeriodsChoice = "TRIMESTRE" | "MOIS" | "BOTH";

export const setupApi = {
  async getStatus(schoolId: string): Promise<SetupStatus> {
    const { data } = await api.get(`/schools/${schoolId}/setup-status`);
    return data.data || data;
  },

  async createPeriods(
    schoolId: string,
    periods: PeriodsChoice,
  ): Promise<{ created: number; periods: string[] }> {
    const { data } = await api.post(`/schools/${schoolId}/setup-periods`, {
      periods,
    });
    return data.data || data;
  },
};
