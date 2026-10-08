import { api } from "@/lib/axios";

export type AnnualDecision = "ADMIS" | "REDOUBLE" | "A_DETERMINER";

export interface AnnualRow {
  student: { id: string; matricule: string; firstName: string; lastName: string };
  periods: Array<{ termId: string; average: number | null }>;
  periodsCount: number;
  complete: boolean;
  annualAverage: number | null;
  rank: number | null;
  decision: AnnualDecision;
}

export interface AnnualResults {
  class: { id: string; name: string; levelName: string; cycle: string };
  scale: number;
  admisThreshold: number;
  periodKind: "MOIS" | "TRIMESTRE";
  periods: Array<{ id: string; name: string }>;
  includeDraft: boolean;
  rows: AnnualRow[];
  stats: {
    count: number;
    admis: number;
    passe: number;
    redouble: number;
    undetermined: number;
    classAverage: number | null;
  };
}

export const annualResultsApi = {
  async get(classId: string, academicYearId: string, includeDraft: boolean): Promise<AnnualResults> {
    const { data } = await api.get("/annual-results", {
      params: { classId, academicYearId, includeDraft: includeDraft ? "true" : "false" },
    });
    return data.data || data;
  },

  async apply(classId: string, academicYearId: string): Promise<{ applied: number; skipped: number }> {
    const { data } = await api.post("/annual-results/apply", { classId, academicYearId });
    return data.data || data;
  },
};
