export type ReportDecision = "ADMIS" | "REDOUBLE" | "EXCLU" | "A_DETERMINER";
export type ReportStatus = "DRAFT" | "VALIDATED" | "PUBLISHED";

export interface ReportCardItem {
  id: string;
  reportCardId: string;
  subjectId: string;
  average: number | null;
  coefficient: number;
  weighted: number | null;
  rank: number | null;
  teacherComment: string | null;
  subject?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ReportCard {
  id: string;
  studentId: string;
  classId: string;
  termId: string;
  academicYearId: string;
  average: number | null;
  rank: number | null;
  classSize: number | null;
  decision: ReportDecision | null;
  appreciation: string | null;
  absencesCount: number;
  latesCount: number;
  status: ReportStatus;
  publishedAt: string | null;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    gender: "M" | "F";
    birthDate: string;
    birthPlace?: string | null;
  };
  class?: {
    id: string;
    code: string;
    name: string;
  };
  term?: {
    id: string;
    name: string;
    orderIndex: number;
  };
  academicYear?: {
    id: string;
    label: string;
  };
  items?: ReportCardItem[];
}

export interface GenerateReportCardsInput {
  academicYearId: string;
  termId: string;
  classId?: string;
  studentId?: string;
}

export interface UpdateReportCardInput {
  decision?: ReportDecision;
  appreciation?: string;
}

export interface ClassRankingItem {
  studentId: string;
  student: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
  };
  average: number;
  rank: number;
}

// Helpers
export const DECISION_LABELS: Record<ReportDecision, string> = {
  ADMIS: "Admis en classe supérieure",
  REDOUBLE: "Redouble",
  EXCLU: "Exclu",
  A_DETERMINER: "À déterminer",
};

export const DECISION_COLORS: Record<ReportDecision, string> = {
  ADMIS: "bg-green-500/10 text-green-700 border-green-300",
  REDOUBLE: "bg-orange-500/10 text-orange-700 border-orange-300",
  EXCLU: "bg-red-500/10 text-red-700 border-red-300",
  A_DETERMINER: "bg-gray-500/10 text-gray-700 border-gray-300",
};

export const STATUS_LABELS: Record<ReportStatus, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-500/10 text-gray-700" },
  VALIDATED: { label: "Validé", color: "bg-blue-500/10 text-blue-700" },
  PUBLISHED: { label: "Publié", color: "bg-green-500/10 text-green-700" },
};

/**
 * Calcule l'appréciation automatique depuis une moyenne.
 */
export function getAppreciation(average: number | null | undefined): string {
  if (average === null || average === undefined) return "—";
  if (average >= 18) return "Excellent";
  if (average >= 16) return "Très bien";
  if (average >= 14) return "Bien";
  if (average >= 12) return "Assez bien";
  if (average >= 10) return "Passable";
  if (average >= 8) return "Insuffisant";
  return "Très insuffisant";
}

export function getAppreciationColor(average: number | null | undefined): string {
  if (average === null || average === undefined) return "text-muted-foreground";
  if (average >= 14) return "text-green-600";
  if (average >= 10) return "text-blue-600";
  if (average >= 8) return "text-orange-600";
  return "text-red-600";
}
