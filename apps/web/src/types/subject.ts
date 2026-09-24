export interface Subject {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  type: "CORE" | "OPTIONAL" | "SPORT" | "ART";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  coefficients?: Array<{
    id: string;
    coefficient: number;
    weeklyHours?: number | null;
    level: { id: string; code: string; name: string };
  }>;
  _count?: { assignments: number; assessments: number };
}

export interface CreateSubjectInput {
  schoolId?: string;
  code: string;
  name: string;
  type?: "CORE" | "OPTIONAL" | "SPORT" | "ART";
  isActive?: boolean;
}
