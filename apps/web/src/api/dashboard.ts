import { api } from "@/lib/axios";

export interface TopStudentEntry {
  rank: number;
  average: number;
  scale: number;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  class: {
    id: string;
    name: string;
  };
}

export interface TopStudentsResponse {
  term: {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
  } | null;
  podiums: {
    PREMIER_CYCLE: TopStudentEntry[];
    DEUXIEME_CYCLE: TopStudentEntry[];
    LYCEE: TopStudentEntry[];
  };
}

export const dashboardApi = {
  async getTopStudents(): Promise<TopStudentsResponse> {
    const { data } = await api.get("/dashboard/top-students");
    return data.data || data;
  },

  async getTeacherDashboard(): Promise<any> {
    const { data } = await api.get("/dashboard/teacher");
    return data.data || data;
  },

  async getSupervisorDashboard(): Promise<any> {
    const { data } = await api.get("/dashboard/supervisor");
    return data.data || data;
  },

  async getSecretaryDashboard(): Promise<any> {
    const { data } = await api.get("/dashboard/secretary");
    return data.data || data;
  },

  async recomputeTopStudents(termId?: string): Promise<any> {
    const { data } = await api.post("/dashboard/top-students/recompute", null, {
      params: termId ? { termId } : undefined,
    });
    return data.data || data;
  },
};
