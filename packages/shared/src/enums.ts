/**
 * SIS-MALI — Énumérations partagées (miroir des enums Prisma)
 */

export enum Gender {
  M = 'M',
  F = 'F',
}

export enum SchoolType {
  FONDAMENTAL = 'FONDAMENTAL',
  PREMIER_CYCLE = 'PREMIER_CYCLE',
  DEUXIEME_CYCLE = 'DEUXIEME_CYCLE',
  LYCEE = 'LYCEE',
  FONDAMENTAL_LYCEE = 'FONDAMENTAL_LYCEE',
}

export enum SchoolStatus {
  PUBLIC = 'PUBLIC',
  PRIVE = 'PRIVE',
  CONFESSIONNEL = 'CONFESSIONNEL',
  LAIC = 'LAIC',
}

export enum AcademicYearStatus {
  PREPARATION = 'PREPARATION',
  ACTIVE = 'ACTIVE',
  CLOTUREE = 'CLOTUREE',
  ARCHIVEE = 'ARCHIVEE',
}

export enum TermType {
  TRIMESTRE = 'TRIMESTRE',
  SEMESTRE = 'SEMESTRE',
  MOIS = 'MOIS', // composition mensuelle (1er cycle)
}

export enum LevelCycle {
  PREMIER_CYCLE = 'PREMIER_CYCLE',
  DEUXIEME_CYCLE = 'DEUXIEME_CYCLE',
  LYCEE = 'LYCEE',
}

export enum ClassStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum RoomType {
  CLASSROOM = 'CLASSROOM',
  LAB = 'LAB',
  COMPUTER_ROOM = 'COMPUTER_ROOM',
  LIBRARY = 'LIBRARY',
  MEETING_ROOM = 'MEETING_ROOM',
  OTHER = 'OTHER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
  DROPPED = 'DROPPED',
  SUSPENDED = 'SUSPENDED',
}

export enum GuardianRelation {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  TUTOR = 'TUTOR',
  OTHER = 'OTHER',
}

export enum DocumentType {
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  SCHOOL_CERTIFICATE = 'SCHOOL_CERTIFICATE',
  TRANSFER = 'TRANSFER',
  PHOTO = 'PHOTO',
  OTHER = 'OTHER',
}

export enum EnrollmentStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PathwayResult {
  PASSED = 'PASSED',
  REPEATED = 'REPEATED',
  EXCLUDED = 'EXCLUDED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum TeacherStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum ContractType {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  VOLUNTEER = 'VOLUNTEER',
}

export enum SubjectType {
  CORE = 'CORE',
  OPTIONAL = 'OPTIONAL',
  SPORT = 'SPORT',
  ART = 'ART',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  ABSENT_JUSTIFIED = 'ABSENT_JUSTIFIED',
  ABSENT_UNJUSTIFIED = 'ABSENT_UNJUSTIFIED',
}

export enum AssessmentType {
  INTERROGATION = 'INTERROGATION',
  DEVOIR = 'DEVOIR',
  CONTROLE = 'CONTROLE',
  COMPOSITION = 'COMPOSITION',
  EXAMEN = 'EXAMEN',
  TP = 'TP',
  ORAL = 'ORAL',
  PROJET = 'PROJET',
}

export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  LOCKED = 'LOCKED',
}

export enum ReportDecision {
  ADMIS = 'ADMIS',
  PASSE = 'PASSE',
  REDOUBLE = 'REDOUBLE',
  EXCLU = 'EXCLU',
  A_DETERMINER = 'A_DETERMINER',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  PUBLISHED = 'PUBLISHED',
}

export enum ExamType {
  INTERNE = 'INTERNE',
  COMPOSITION = 'COMPOSITION',
  BLANC = 'BLANC',
  FIN_ANNEE = 'FIN_ANNEE',
}

export enum ExamStatus {
  PLANNED = 'PLANNED',
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum FeeCategory {
  INSCRIPTION = 'INSCRIPTION',
  SCOLARITE = 'SCOLARITE',
  TRANSPORT = 'TRANSPORT',
  CANTINE = 'CANTINE',
  UNIFORME = 'UNIFORME',
  FOURNITURES = 'FOURNITURES',
  EXAMEN = 'EXAMEN',
  AUTRE = 'AUTRE',
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
  MOBILE_MONEY = 'MOBILE_MONEY',
  OTHER = 'OTHER',
}

export enum CashStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum DocumentTemplateType {
  CERTIFICATE = 'CERTIFICATE',
  ATTESTATION = 'ATTESTATION',
  RECEIPT = 'RECEIPT',
  REPORT_CARD = 'REPORT_CARD',
  TRANSCRIPT = 'TRANSCRIPT',
  ENROLLMENT_FORM = 'ENROLLMENT_FORM',
  STUDENT_SHEET = 'STUDENT_SHEET',
  TRANSFER = 'TRANSFER',
  DECISION = 'DECISION',
  PV = 'PV',
  CLASS_LIST = 'CLASS_LIST',
}

export enum NotificationType {
  ENROLLMENT = 'ENROLLMENT',
  ABSENCE = 'ABSENCE',
  LATE = 'LATE',
  PAYMENT = 'PAYMENT',
  GRADES_PUBLISHED = 'GRADES_PUBLISHED',
  REPORT_AVAILABLE = 'REPORT_AVAILABLE',
  MEETING = 'MEETING',
  OTHER = 'OTHER',
}

export enum NotificationChannel {
  INTERNAL = 'INTERNAL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

export enum BackupType {
  DB = 'DB',
  FILES = 'FILES',
  FULL = 'FULL',
}

export enum BackupStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  IN_PROGRESS = 'IN_PROGRESS',
}

// ============================================================
// RÔLES SYSTÈME (pas un enum Prisma — chaînes de caractères)
// ============================================================

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DIRECTOR: 'DIRECTOR',
  SECRETARY: 'SECRETARY',
  TEACHER: 'TEACHER',
  ACCOUNTANT: 'ACCOUNTANT',
  SUPERVISOR: 'SUPERVISOR',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
} as const;

export type SystemRole = keyof typeof SYSTEM_ROLES;

// ============================================================
// ACTIONS DE PERMISSION
// ============================================================

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'update',
  'delete',
  'validate',
  'export',
  'print',
  'lock',
  'close',
  'archive',
  'restore',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

// ============================================================
// MODULES DE PERMISSION
// ============================================================

export const PERMISSION_MODULES = [
  'school',
  'academic_year',
  'level',
  'class',
  'student',
  'parent',
  'enrollment',
  'teacher',
  'subject',
  'assignment',
  'timetable',
  'attendance',
  'assessment',
  'grade',
  'report_card',
  'exam',
  'fee',
  'invoice',
  'payment',
  'cash',
  'document',
  'notification',
  'report',
  'user',
  'role',
  'audit',
  'backup',
  'settings',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];