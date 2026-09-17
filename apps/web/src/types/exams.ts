export type ExamType = "INTERNE" | "COMPOSITION" | "BLANC" | "FIN_ANNEE";
export type ExamStatus = "PLANNED" | "ONGOING" | "FINISHED" | "CANCELLED";

export interface Exam {
  id: string;
  schoolId: string;
  academicYearId: string;
  termId?: string | null;
  type: ExamType;
  name: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  term?: { id: string; name: string } | null;
  academicYear?: { id: string; label: string };
  sessions?: Array<{
    id: string;
    subject: { id: string; code: string; name: string };
    class: { id: string; code: string; name: string };
    date: string;
    startTime: string;
    endTime: string;
    _count?: { candidates: number };
  }>;
  _count?: { sessions: number };
}
