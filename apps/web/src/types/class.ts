// ============================================================
// TYPES — MODULE CLASSES
// ============================================================

export type LevelCycle = "PREMIER_CYCLE" | "DEUXIEME_CYCLE";

export type ClassStatus = "OPEN" | "CLOSED" | "ARCHIVED";

// --- Niveau (Level) ---
export interface Level {
  id: string;
  schoolId: string;
  cycle: LevelCycle;
  name: string;         // ex: "1ère Année", "9ème Année (DEF)"
  code: string;         // ex: "1ERE", "9EME"
  orderIndex: number;   // 1 à 9
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    classes?: number;
  };
}

// --- Salle (Room) ---
export type RoomType =
  | "CLASSROOM"
  | "LABORATORY"
  | "LIBRARY"
  | "OFFICE"
  | "GYMNASIUM"
  | "OTHER";

export interface Room {
  id: string;
  schoolId: string;
  name: string;                    // ex: "Salle 1A", "Bibliothèque"
  type?: RoomType | string;        // enum côté backend
  capacity?: number | null;
  location?: string | null;
  equipment?: string | null;
  isAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    classes?: number;
  };
}

// --- Enseignant (version minimale pour les selects) ---
export interface TeacherSimple {
  id: string;
  userId?: string;
  matricule?: string | null;
  firstName: string;
  lastName: string;
  gender?: "M" | "F" | string;
  phone?: string | null;
  email?: string | null;
  specialty?: string | null;
}

// --- Année scolaire ---
export type AcademicYearStatus = "PLANNED" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export interface AcademicYear {
  id: string;
  schoolId: string;
  label: string;              // ex: "2026-2027"
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  isCurrent: boolean;
  closedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Classe (structure complète) ---
export interface ClassItem {
  id: string;
  schoolId: string;
  academicYearId: string;
  levelId: string;
  code: string;          // ex: "1A", "9B"
  name: string;          // ex: "1ère A", "9ème B"
  roomId?: string | null;
  capacity?: number | null;
  mainTeacherId?: string | null;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;

  // Relations (retournées par l'API)
  level?: Level;
  room?: Room | null;
  mainTeacher?: TeacherSimple | null;
  academicYear?: AcademicYear;
  _count?: {
    enrollments: number;
    assignments: number;
  };
}

// --- DTO Création de classe ---
export interface CreateClassInput {
  schoolId?: string;     // optionnel : le backend peut le déduire du token
  academicYearId: string;
  levelId: string;
  code: string;
  name: string;
  roomId?: string | null;
  capacity?: number;
  mainTeacherId?: string | null;
  status?: ClassStatus;
}

// --- Filtres de liste ---
export interface ClassListFilters {
  academicYearId?: string;
  levelId?: string;
  cycle?: LevelCycle;
}

// --- Helpers ---
export const CYCLE_LABELS: Record<LevelCycle, string> = {
  PREMIER_CYCLE: "Premier cycle (1ère → 6ème année)",
  DEUXIEME_CYCLE: "Deuxième cycle (7ème → 9ème année)",
};

export const CYCLE_SHORT: Record<LevelCycle, string> = {
  PREMIER_CYCLE: "1er cycle",
  DEUXIEME_CYCLE: "2ème cycle",
};

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  OPEN: "Ouverte",
  CLOSED: "Fermée",
  ARCHIVED: "Archivée",
};
