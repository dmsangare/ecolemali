export interface Student {
  id: string;
  schoolId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthDate: string;
  birthPlace?: string | null;
  nationality?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  specialSituation?: string | null;
  status: "ACTIVE" | "TRANSFERRED" | "GRADUATED" | "DROPPED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;

  // Enrichissements calcules
  enrollmentStatus?: "NOUVEAU" | "ANCIEN" | "REDOUBLANT";
  yearsEnrolled?: number;
  isRedoublant?: boolean;
  previousClass?: string | null;
  unpaidAmount?: number;

  // Relations
  guardians?: StudentGuardianRelation[];
  enrollments?: StudentEnrollment[];
  pathways?: StudentPathway[];
  documents?: StudentDocument[];
  invoices?: StudentInvoice[];
  _count?: {
    invoices: number;
    payments: number;
    reportCards: number;
  };
}

export interface StudentGuardianRelation {
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    relationType: "FATHER" | "MOTHER" | "TUTOR" | "OTHER";
    profession?: string | null;
  };
  isPrimary: boolean;
}

export interface StudentEnrollment {
  id: string;
  classId?: string;
  levelId?: string;
  class?: { id: string; code: string; name: string } | null;
  level?: { id: string; code: string; name: string; cycle?: string } | null;
  academicYear?: { id: string; label: string; isCurrent?: boolean } | null;
  status?: string;
  enrollmentDate?: string;
}

export interface StudentPathway {
  id: string;
  result?: "PASSED" | "REPEATED" | "EXCLUDED" | "TRANSFERRED" | null;
  decision?: string | null;
  createdAt: string;
  academicYear?: { id: string; label: string } | null;
  level?: { id: string; code: string; name: string } | null;
  class?: { id: string; code: string; name: string } | null;
}

export interface StudentDocument {
  id: string;
  type: "BIRTH_CERTIFICATE" | "SCHOOL_CERTIFICATE" | "TRANSFER" | "PHOTO" | "OTHER";
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedAt: string;
  uploadedBy?: string | null;
}

export interface StudentInvoice {
  id: string;
  number: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  issuedAt: string;
  dueDate?: string | null;
}

export interface StudentListFilters {
  page?: number;
  limit?: number;
  q?: string;
  classId?: string;
  levelId?: string;
  cycle?: string;
  gender?: string;
  ageRange?: string;
  status?: string;
  enrollmentStatus?: "NOUVEAU" | "ANCIEN" | "REDOUBLANT";
  onlyNew?: boolean;
  onlyUnpaid?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface PaginatedStudents {
  data: Student[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateStudentInput {
  schoolId: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthDate: string;
  birthPlace?: string;
  nationality?: string;
  phone?: string;
  address?: string;
  specialSituation?: string;
}

export interface StudentStats {
  total: number;
  boys: number;
  girls: number;
  newCount: number;
  ancienCount: number;
  redoublantCount: number;
  byCycle: Array<{
    cycle: "PREMIER_CYCLE" | "DEUXIEME_CYCLE" | "LYCEE";
    count: number;
  }>;
}

/**
 * Detail complet d'un eleve avec toutes ses relations.
 */
export interface StudentDetail extends Student {
  guardians: StudentGuardianRelation[];
  enrollments: StudentEnrollment[];
  pathways: StudentPathway[];
  documents: StudentDocument[];
  invoices: StudentInvoice[];
}
