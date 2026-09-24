export type ExamType = "INTERNE" | "COMPOSITION" | "BLANC" | "FIN_ANNEE";
export type ExamStatus = "PLANNED" | "ONGOING" | "FINISHED" | "CANCELLED";

export interface ExamSession {
  id: string;
  examId: string;
  subjectId: string;
  classId: string;
  roomId?: string | null;
  supervisorId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  subject?: { id: string; code: string; name: string };
  class?: { id: string; code: string; name: string };
  room?: { id: string; name: string } | null;
  supervisor?: { id: string; firstName: string; lastName: string } | null;
  candidates?: ExamCandidate[];
  _count?: { candidates: number };
}

export interface ExamCandidate {
  id: string;
  examSessionId: string;
  studentId: string;
  isPresent?: boolean | null;
  score?: number | string | null;
  observation?: string | null;
  student?: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
  };
}

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
  sessions?: ExamSession[];
  _count?: { sessions: number };
}
