import { api } from "@/lib/axios";

export type StateExamResult = "ADMIS" | "REFUSE" | "ABSENT" | "EN_ATTENTE";
export type StateExamType = "NONE" | "DEF" | "BAC";

export interface StateExamLevel {
  id: string;
  name: string;
  code: string;
  cycle: string;
  stateExamType: StateExamType;
  classesCount: number;
  studentsCount: number;
}

export interface StateExamCandidate {
  studentId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: string;
  className: string;
  classId: string;
  result: StateExamResult;
  score: number | null;
  observation: string | null;
}

export interface SaveStateExamResultsInput {
  levelId: string;
  academicYearId: string;
  results: Array<{
    studentId: string;
    result: StateExamResult;
    score?: number;
    observation?: string;
  }>;
}

export const stateExamsApi = {
  async listLevels(): Promise<StateExamLevel[]> {
    const { data } = await api.get("/state-exams/levels");
    return data.data || data;
  },

  async listCandidates(
    levelId: string,
    academicYearId: string,
  ): Promise<StateExamCandidate[]> {
    const { data } = await api.get(
      `/state-exams/levels/${levelId}/candidates`,
      { params: { academicYearId } },
    );
    return data.data || data;
  },

  async saveResults(input: SaveStateExamResultsInput): Promise<any> {
    const { data } = await api.post("/state-exams/results", input);
    return data.data || data;
  },
};
