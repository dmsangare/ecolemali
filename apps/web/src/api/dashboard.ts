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
  /** Periode affichee pour chaque cycle (mois pour le 1er cycle, trimestre ensuite) */
  periods?: Record<string, { termId: string; name: string; type: string } | null>;
}


export interface HonorRollClassEntry {
  rank: number;
  classId: string;
  className: string;
  levelName: string | null;
  average: number;
  scale: number;
  studentsCount: number;
}

export interface HonorRollResponse {
  topN: number;
  term: {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
  } | null;
  podiums: {
    PREMIER_CYCLE: HonorRollClassEntry[];
    DEUXIEME_CYCLE: HonorRollClassEntry[];
    LYCEE: HonorRollClassEntry[];
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

  async getHonorRoll(termId?: string, cycle?: string): Promise<HonorRollResponse> {
    const params: any = {};
    if (termId) params.termId = termId;
    if (cycle) params.cycle = cycle;
    const { data } = await api.get("/dashboard/honor-roll", { params });
    return data.data || data;
  },
  async recomputeTopStudents(termId?: string): Promise<any> {
    const { data } = await api.post("/dashboard/top-students/recompute", null, {
      params: termId ? { termId } : undefined,
    });
    return data.data || data;
  },
};
