export type LevelCycle = "PREMIER_CYCLE" | "DEUXIEME_CYCLE";
export type StateExamType = "NONE" | "CEP" | "DEF" | "BAC";

export interface Level {
  id: string;
  schoolId: string;
  cycle: LevelCycle;
  name: string;
  code: string;
  stateExamType: StateExamType;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLevelInput {
  schoolId: string;
  cycle: LevelCycle;
  name: string;
  code: string;
  stateExamType?: StateExamType;
  orderIndex: number;
  isActive?: boolean;
}

export type UpdateLevelInput = Partial<Omit<CreateLevelInput, "schoolId">>;
