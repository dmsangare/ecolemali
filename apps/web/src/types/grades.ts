export type AssessmentType =
  | "INTERROGATION"
  | "DEVOIR"
  | "CONTROLE"
  | "COMPOSITION"
  | "EXAMEN"
  | "TP"
  | "ORAL"
  | "PROJET";

export type AssessmentStatus =
  | "DRAFT"
  | "OPEN"
  | "SUBMITTED"
  | "VALIDATED"
  | "LOCKED";

export interface Assessment {
  id: string;
  schoolId: string;
  academicYearId: string;
  termId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  type: AssessmentType;
  title: string;
  date: string;
  maxScore: number;
  coefficient: number;
  durationMin?: number | null;
  status: AssessmentStatus;
  observation?: string | null;
  class?: { id: string; code: string; name: string };
  subject?: { id: string; code: string; name: string };
  teacher?: { id: string; firstName: string; lastName: string };
  term?: { id: string; name: string };
  _count?: { grades: number };
}

export interface StudentGrade {
  studentId: string;
  student: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    gender: "M" | "F";
  };
  grade: {
    id: string;
    value: number | null;
    isAbsent: boolean;
    observation?: string | null;
    locked: boolean;
  } | null;
}

export interface AssessmentGrades {
  assessment: Assessment;
  grades: StudentGrade[];
}

export interface CreateAssessmentInput {
  schoolId: string;
  academicYearId: string;
  termId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  type: AssessmentType;
  title: string;
  date: string;
  maxScore?: number;
  coefficient?: number;
  durationMin?: number;
  observation?: string;
}

export interface GradeEntry {
  studentId: string;
  value: number | null;
  isAbsent?: boolean;
  observation?: string;
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
  decision: string | null;
  appreciation?: string | null;
  absencesCount: number;
  latesCount: number;
  status: "DRAFT" | "VALIDATED" | "PUBLISHED";
  publishedAt?: string | null;
  pdfUrl?: string | null;
  student?: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
  };
  class?: { id: string; code: string; name: string };
  term?: { id: string; name: string };
  items?: Array<{
    id: string;
    subjectId: string;
    average: number | null;
    coefficient: number;
    weighted: number | null;
    rank: number | null;
    teacherComment?: string | null;
    subject: { id: string; code: string; name: string };
  }>;
}
