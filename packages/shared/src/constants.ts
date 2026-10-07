/**
 * SIS-MALI — Constantes métier (Mali)
 */

// ============================================================
// NIVEAUX SCOLAIRES MALIENS
// ============================================================

export const MALI_LEVELS = [
  // Premier cycle (1ère à 6ème année)
  { cycle: 'PREMIER_CYCLE', name: '1ère Année', code: '1ERE', orderIndex: 1 },
  { cycle: 'PREMIER_CYCLE', name: '2ème Année', code: '2EME', orderIndex: 2 },
  { cycle: 'PREMIER_CYCLE', name: '3ème Année', code: '3EME', orderIndex: 3 },
  { cycle: 'PREMIER_CYCLE', name: '4ème Année', code: '4EME', orderIndex: 4 },
  { cycle: 'PREMIER_CYCLE', name: '5ème Année', code: '5EME', orderIndex: 5 },
  { cycle: 'PREMIER_CYCLE', name: '6ème Année', code: '6EME', orderIndex: 6 },
  // Deuxième cycle (7ème à 9ème — DEF)
  { cycle: 'DEUXIEME_CYCLE', name: '7ème Année', code: '7EME', orderIndex: 7 },
  { cycle: 'DEUXIEME_CYCLE', name: '8ème Année', code: '8EME', orderIndex: 8 },
  { cycle: 'DEUXIEME_CYCLE', name: '9ème Année (DEF)', code: '9EME', orderIndex: 9 },
  // Lycée (10ème à 12ème — BAC)
  { cycle: 'LYCEE', name: '10ème Année', code: '10EME', orderIndex: 10 },
  { cycle: 'LYCEE', name: '11ème Année', code: '11EME', orderIndex: 11 },
  { cycle: 'LYCEE', name: '12ème Année (BAC)', code: '12EME', orderIndex: 12 },
] as const;

// ============================================================
// MATIÈRES STANDARD AVEC COEFFICIENTS
// ============================================================

export const STANDARD_SUBJECTS = [
  { code: 'MATH', name: 'Mathématiques', type: 'CORE', coefficient: 4 },
  { code: 'FR', name: 'Français', type: 'CORE', coefficient: 4 },
  { code: 'ANG', name: 'Anglais', type: 'CORE', coefficient: 2 },
  { code: 'PC', name: 'Physique-Chimie', type: 'CORE', coefficient: 3 },
  { code: 'HG', name: 'Histoire-Géographie', type: 'CORE', coefficient: 2 },
  { code: 'SVT', name: 'Sciences de la Vie et de la Terre', type: 'CORE', coefficient: 2 },
  { code: 'ECM', name: 'Éducation Civique et Morale', type: 'CORE', coefficient: 1 },
  { code: 'EPS', name: 'Éducation Physique et Sportive', type: 'SPORT', coefficient: 1 },
  { code: 'ART', name: 'Arts Plastiques', type: 'ART', coefficient: 1 },
] as const;

// ============================================================
// RÉGIONS DU MALI
// ============================================================

export const MALI_REGIONS = [
  'Bamako',
  'Kayes',
  'Koulikoro',
  'Sikasso',
  'Ségou',
  'Mopti',
  'Tombouctou',
  'Gao',
  'Kidal',
  'Ménaka',
  'Taoudénit',
] as const;

// ============================================================
// DEVISE ET FORMAT
// ============================================================

export const DEFAULT_CURRENCY = 'FCFA';
export const DEFAULT_LOCALE = 'fr-FR';
export const DEFAULT_TIMEZONE = 'Africa/Bamako';
export const DEFAULT_COUNTRY = 'ML';

// ============================================================
// CALCUL DES MOYENNES
// ============================================================

export const DEFAULT_GRADING_SCALE = 20;
export const DEFAULT_PASS_MARK = 10;

export const REPORT_DECISION_THRESHOLDS = {
  ADMIS: 10,
  PASSE: 8,
  REDOUBLE: 0,
} as const;

// ============================================================
// SÉCURITÉ
// ============================================================

export const BCRYPT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MINUTES = 15;
export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '7d';

// ============================================================
// MATRICULE
// ============================================================

// MATRICULE_PREFIX supprime : le sigle vient de school.sigle (BDD)
export const MATRICULE_SEQUENCE_LENGTH = 6;

// ============================================================
// PAGINATION
// ============================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 200;

// ============================================================
// TYPES DE DOCUMENTS
// ============================================================

export const DOCUMENT_TYPES_LABELS: Record<string, string> = {
  CERTIFICATE: 'Certificat de scolarité',
  ATTESTATION: 'Attestation de fréquentation',
  RECEIPT: 'Reçu de paiement',
  REPORT_CARD: 'Bulletin scolaire',
  TRANSCRIPT: 'Relevé de notes',
  ENROLLMENT_FORM: "Fiche d'inscription",
  STUDENT_SHEET: 'Fiche élève',
  TRANSFER: 'Certificat de transfert',
  DECISION: 'Décision de passage',
  PV: 'Procès-verbal',
  CLASS_LIST: 'Liste de classe',
};

// ============================================================
// STATUTS LISIBLES (pour l'interface)
// ============================================================

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Non payé',
  PARTIAL: 'Partiellement payé',
  PAID: 'Payé',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulé',
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  LATE: 'Retard',
  ABSENT_JUSTIFIED: 'Absent justifié',
  ABSENT_UNJUSTIFIED: 'Absent non justifié',
};

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Validée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  TRANSFER: 'Virement',
  CHECK: 'Chèque',
  MOBILE_MONEY: 'Mobile Money',
  OTHER: 'Autre',
};

export const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  INTERROGATION: 'Interrogation',
  DEVOIR: 'Devoir',
  CONTROLE: 'Contrôle',
  COMPOSITION: 'Composition',
  EXAMEN: 'Examen',
  TP: 'Travaux pratiques',
  ORAL: 'Oral',
  PROJET: 'Projet',
};