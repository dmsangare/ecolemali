/**
 * SIS-MALI — Types TypeScript partagés (DTOs et réponses API)
 */

// ============================================================
// RÉPONSES API STANDARD
// ============================================================

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  details?: Array<{ field: string; message: string }>;
  timestamp: string;
  path: string;
}

// ============================================================
// AUTH
// ============================================================

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  schoolId: string | null;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  email: string | null;
  schoolId: string | null;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DirectorDashboard {
  studentsCount: number;
  teachersCount: number;
  classesCount: number;
  attendanceRate: number;
  unpaidAmount: number;
  revenueAmount: number;
  genderSplit: { boys: number; girls: number };
  enrollmentEvolution: Array<{ month: string; count: number }>;
  topPerformers: Array<{
    studentId: string;
    matricule: string;
    firstName: string;
    lastName: string;
    average: number;
  }>;
}

export interface TeacherDashboard {
  myClasses: Array<{ id: string; code: string; name: string; studentsCount: number }>;
  mySubjects: Array<{ id: string; code: string; name: string }>;
  pendingAssessments: number;
  pendingGrades: number;
  todaySchedule: Array<{
    time: string;
    subject: string;
    class: string;
    room: string | null;
  }>;
}

export interface ParentDashboard {
  children: Array<{
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    className: string;
    average: number | null;
    absencesCount: number;
    balance: number;
  }>;
  recentNotifications: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
  }>;
}

// ============================================================
// STATISTIQUES
// ============================================================

export interface StudentStats {
  total: number;
  boys: number;
  girls: number;
  byLevel: Array<{ levelCode: string; levelName: string; count: number }>;
  byClass: Array<{ classCode: string; className: string; count: number }>;
  newStudents: number;
  returningStudents: number;
}

export interface PedagogicalStats {
  globalAverage: number;
  successRate: number;
  failureRate: number;
  bySubject: Array<{ subjectCode: string; subjectName: string; average: number }>;
  byClass: Array<{ classCode: string; className: string; average: number }>;
}

export interface FinancialStats {
  totalRevenue: number;
  totalUnpaid: number;
  paidInvoices: number;
  unpaidInvoices: number;
  partialInvoices: number;
  byMonth: Array<{ month: string; revenue: number }>;
  byFeeCategory: Array<{ category: string; amount: number }>;
}

// ============================================================
// IMPORT / EXPORT
// ============================================================

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv';