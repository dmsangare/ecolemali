export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "ABSENT_JUSTIFIED"
  | "ABSENT_UNJUSTIFIED";

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  justification?: string | null;
  justifiedAt?: string | null;
  student?: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    gender: "M" | "F";
  };
}

export interface AttendanceSession {
  id: string;
  classId: string;
  subjectId?: string | null;
  teacherId: string;
  termId: string;
  date: string;
  startTime: string;
  endTime: string;
  class?: { id: string; code: string; name: string };
  subject?: { id: string; code: string; name: string } | null;
  teacher?: { id: string; firstName: string; lastName: string };
  term?: { id: string; name: string };
  records?: AttendanceRecord[];
  _count?: { records: number };
}

export interface CreateAttendanceInput {
  classId: string;
  subjectId?: string | null;
  teacherId: string;
  termId: string;
  date: string;
  startTime: string;
  endTime: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    justification?: string;
  }>;
}

export interface AttendanceStats {
  sessionsCount?: number;
  total: number;
  present: number;
  absent: number;
  absentJustified: number;
  late: number;
  presenceRate: number;
  absenceRate?: number;
}
