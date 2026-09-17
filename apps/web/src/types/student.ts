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
  enrollments?: Array<{
    class?: { id: string; code: string; name: string } | null;
    level?: { id: string; code: string; name: string } | null;
  }>;
  guardians?: Array<{
    guardian: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      relationType: string;
    };
    isPrimary: boolean;
  }>;
  documents?: Array<{
    id: string;
    type: string;
    fileUrl: string;
    fileName?: string | null;
    uploadedAt: string;
  }>;
  _count?: {
    invoices: number;
    payments: number;
    reportCards: number;
  };
}

export interface StudentListFilters {
  page?: number;
  limit?: number;
  q?: string;
  classId?: string;
  levelId?: string;
  status?: string;
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
