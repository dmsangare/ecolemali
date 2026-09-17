export interface Teacher {
  id: string;
  schoolId: string;
  userId?: string | null;
  matricule: string;
  firstName: string;
  lastName: string;
  gender?: "M" | "F" | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  specialty?: string | null;
  diploma?: string | null;
  hireDate?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  contractType?: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: Array<{
    subject: { id: string; code: string; name: string };
    class: { id: string; code: string; name: string };
  }>;
  _count?: {
    assignments: number;
    timetableSlots: number;
    mainTeacherClasses: number;
  };
}

export interface CreateTeacherInput {
  schoolId: string;
  matricule?: string;
  firstName: string;
  lastName: string;
  gender?: "M" | "F";
  phone?: string;
  email?: string;
  address?: string;
  specialty?: string;
  diploma?: string;
  hireDate?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  contractType?: "PERMANENT" | "CONTRACT" | "TEMPORARY" | "VOLUNTEER";
}
