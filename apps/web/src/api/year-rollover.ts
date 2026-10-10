import { api } from "@/lib/axios";

// ============================================================
// BLOC G — Client API pour le passage a l'annee suivante
// ============================================================

export type PeriodsToClone = "TRIMESTRE" | "SEMESTRE" | "MOIS";

export type RolloverDecision =
  | "ADMIS"
  | "REDOUBLE"
  | "QUITTE_ECOLE"
  | "DIPLOME"
  | "NON_INSCRIT"
  | "EN_ATTENTE_DEF"
  | "EN_ATTENTE_BAC";

export interface StructureToClone {
  classes: boolean;
  teacherAssignments: boolean;
  feeStructures: boolean;
  timetable: boolean;
}

export interface PreviewYearRolloverInput {
  fromYearId: string;
  newLabel: string;
  newStartDate: string;
  newEndDate: string;
  periodsToClone: PeriodsToClone[];
  structureToClone: StructureToClone;
  feeIncreasePercent: number;
}

export interface DecisionOverride {
  studentId: string;
  decision: RolloverDecision;
  targetClassId?: string;
}

export interface ExecuteYearRolloverInput extends PreviewYearRolloverInput {
  decisions: DecisionOverride[];
}

export interface PreviewPeriod {
  name: string;
  type: PeriodsToClone;
  startDate: string;
  endDate: string;
  orderIndex: number;
}

export interface PreviewClass {
  fromClassId: string;
  code: string;
  name: string;
  levelId: string;
  levelName: string;
  cycle: string;
  studentsCount: number;
  capacity: number | null;
}

export interface PreviewFee {
  fromFeeStructureId: string;
  levelId: string | null;
  levelName: string | null;
  feeTypeId: string;
  feeTypeName: string;
  installments: number;
  dueDate: string | null;
  oldAmount: number;
  newAmount: number;
}

export interface PreviewDecision {
  studentId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  fromClassId: string;
  fromClassName: string;
  fromLevelId: string;
  fromLevelName: string;
  fromCycle: string;
  decision: RolloverDecision;
  targetClassId: string | null;
  targetClassName: string | null;
  targetLevelId: string | null;
  note: string;
}

export interface PreviewStats {
  ADMIS: number;
  REDOUBLE: number;
  QUITTE_ECOLE: number;
  DIPLOME: number;
  NON_INSCRIT: number;
  EN_ATTENTE_DEF: number;
  EN_ATTENTE_BAC: number;
  total: number;
}

export interface PreviewYearRolloverResult {
  sourceYear: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
  };
  newYear: {
    label: string;
    startDate: string;
    endDate: string;
  };
  periods: PreviewPeriod[];
  classes: PreviewClass[];
  feeStructures: PreviewFee[];
  feeIncreasePercent: number;
  decisions: PreviewDecision[];
  stats: PreviewStats;
}

export interface ExecuteYearRolloverResult {
  newYearId: string;
  newYearLabel: string;
  periodsCreated: number;
  classesCreated: number;
  feesCreated: number;
  enrollmentsCreated: number;
  skipped: number;
}

export const yearRolloverApi = {
  async preview(input: PreviewYearRolloverInput): Promise<PreviewYearRolloverResult> {
    const { data } = await api.post("/year-rollover/preview", input);
    return data.data || data;
  },

  async execute(input: ExecuteYearRolloverInput): Promise<ExecuteYearRolloverResult> {
    const { data } = await api.post("/year-rollover/execute", input);
    return data.data || data;
  },
};
