import { api } from "@/lib/axios";

const unwrap = (res: any) => res.data?.data ?? res.data;

// ============================================================
// Types
// ============================================================

export interface AdminReportTemplate {
  id: string;
  schoolId: string | null;
  code: string;
  title: string;
  description: string | null;
  category:
    | "RENTREE"
    | "STATISTIQUES"
    | "PERSONNEL"
    | "INFRASTRUCTURES"
    | "SITUATION_ANNUELLE"
    | "FIN_ANNEE"
    | "EXAMENS"
    | "COMPLEMENTAIRE";
  status:
    | "MODELE_INTERNE"
    | "INSTRUCTION_LOCALE_VERIFIEE"
    | "OFFICIEL_VERIFIE"
    | "A_CONFIRMER"
    | "ARCHIVE";
  authorityTarget: string | null;
  version: number;
  isActive: boolean;
}

export type AdminReportStatus =
  | "NON_PREPARE"
  | "BROUILLON"
  | "EN_VERIFICATION"
  | "A_VALIDER"
  | "VALIDE"
  | "PRET_A_TRANSMETTRE"
  | "TRANSMIS"
  | "RECEPTION_CONFIRMEE"
  | "A_CORRIGER"
  | "NOUVELLE_VERSION_REQUISE"
  | "CLOTURE";

export interface AdminReport {
  id: string;
  schoolId: string;
  templateId: string | null;
  academicYearId: string | null;
  code: string;
  title: string;
  status: AdminReportStatus;
  referenceDate: string | null;
  periodLabel: string | null;
  bordereauNumber: string | null;
  data: any;
  snapshot: any;
  version: number;
  createdBy: string | null;
  validatedBy: string | null;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template?: { code: string; title: string; category: string } | null;
}

export interface AdminReportTransmission {
  id: string;
  reportId: string;
  version: number;
  recipient: string;
  recipientRole: string | null;
  channel: "DEPOT_PHYSIQUE" | "COURRIER" | "EMAIL_ADMIN" | "PORTAIL_OFFICIEL" | "API_OFFICIELLE";
  sentAt: string;
  sentBy: string | null;
  bordereauNumber: string | null;
  referenceNumber: string | null;
  proofUrl: string | null;
  acknowledgmentUrl: string | null;
  observations: string | null;
}

export interface AdminReportVersion {
  id: string;
  reportId: string;
  version: number;
  data: any;
  snapshot: any;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface AdminReportDeadline {
  id: string;
  schoolId: string;
  templateCode: string;
  title: string;
  academicYearId: string | null;
  recipient: string | null;
  prepareFrom: string | null;
  deadline: string;
  source: string | null;
  confidenceLevel: string | null;
  responsibleUserId: string | null;
  status: string | null;
}

// ============================================================
// API
// ============================================================

export const adminReportsApi = {
  // --- Health ---
  health: async () => {
    const res = await api.get("/admin-reports/health");
    return unwrap(res);
  },

  // --- Seed ---
  seed: async () => {
    const res = await api.post("/admin-reports/seed");
    return unwrap(res);
  },

  // --- Templates ---
  listTemplates: async (params?: { category?: string; status?: string; activeOnly?: boolean }) => {
    const res = await api.get("/admin-reports/templates", { params });
    return unwrap(res) as AdminReportTemplate[];
  },
  getTemplate: async (id: string) => {
    const res = await api.get(`/admin-reports/templates/${id}`);
    return unwrap(res) as AdminReportTemplate;
  },

  // --- Reports ---
  listReports: async (params?: { status?: AdminReportStatus; academicYearId?: string }) => {
    const res = await api.get("/admin-reports/reports", { params });
    return unwrap(res) as AdminReport[];
  },
  getReport: async (id: string) => {
    const res = await api.get(`/admin-reports/reports/${id}`);
    return unwrap(res) as AdminReport & {
      versions: AdminReportVersion[];
      transmissions: AdminReportTransmission[];
      auditLogs: any[];
    };
  },
  createReport: async (body: {
    templateCode: string;
    academicYearId?: string;
    title?: string;
    periodLabel?: string;
    referenceDate?: string;
  }) => {
    const res = await api.post("/admin-reports/reports", body);
    return unwrap(res) as AdminReport;
  },
  generateReport: async (id: string) => {
    const res = await api.post(`/admin-reports/reports/${id}/generate`);
    return unwrap(res) as AdminReport;
  },
  patchReport: async (id: string, body: any) => {
    const res = await api.patch(`/admin-reports/reports/${id}`, body);
    return unwrap(res) as AdminReport;
  },

  // --- Workflow validation ---
  submitReport: async (id: string) => {
    const res = await api.post(`/admin-reports/reports/${id}/submit`);
    return unwrap(res) as AdminReport;
  },
  validateReport: async (id: string) => {
    const res = await api.post(`/admin-reports/reports/${id}/validate`);
    return unwrap(res) as AdminReport;
  },
  unlockReport: async (id: string, reason: string) => {
    const res = await api.post(`/admin-reports/reports/${id}/unlock`, { reason });
    return unwrap(res) as AdminReport;
  },
  listVersions: async (id: string) => {
    const res = await api.get(`/admin-reports/reports/${id}/versions`);
    return unwrap(res);
  },

  // --- Transmission ---
  transmitReport: async (
    id: string,
    body: {
      recipient: string;
      recipientRole?: string;
      channel: string;
      proofUrl?: string;
      referenceNumber?: string;
      observations?: string;
    },
  ) => {
    const res = await api.post(`/admin-reports/reports/${id}/transmit`, body);
    return unwrap(res);
  },
  receiveReport: async (
    id: string,
    body: { transmissionId?: string; receiptUrl?: string; observations?: string },
  ) => {
    const res = await api.post(`/admin-reports/reports/${id}/receive`, body);
    return unwrap(res);
  },
  listTransmissions: async (id: string) => {
    const res = await api.get(`/admin-reports/reports/${id}/transmissions`);
    return unwrap(res);
  },

  // --- PDF / Excel ---
  downloadPdf: (id: string) => {
    const baseUrl = (api.defaults.baseURL ?? "").replace(/\/$/, "");
    return `${baseUrl}/admin-reports/reports/${id}/pdf`;
  },
  downloadExcel: (id: string) => {
    const baseUrl = (api.defaults.baseURL ?? "").replace(/\/$/, "");
    return `${baseUrl}/admin-reports/reports/${id}/excel`;
  },

  // --- Archives ---
  listArchives: async (params?: { academicYearId?: string; code?: string; status?: string }) => {
    const res = await api.get("/admin-reports/archives", { params });
    return unwrap(res) as AdminReport[];
  },
  downloadArchivesExcel: () => {
    const baseUrl = (api.defaults.baseURL ?? "").replace(/\/$/, "");
    return `${baseUrl}/admin-reports/archives/export`;
  },

  // --- Deadlines ---
  listDeadlines: async (academicYearId?: string) => {
    const res = await api.get("/admin-reports/deadlines", { params: { academicYearId } });
    return unwrap(res) as AdminReportDeadline[];
  },
  listUpcomingDeadlines: async (days = 30) => {
    const res = await api.get("/admin-reports/deadlines/upcoming", { params: { days } });
    return unwrap(res) as AdminReportDeadline[];
  },
  createDeadline: async (body: any) => {
    const res = await api.post("/admin-reports/deadlines", body);
    return unwrap(res) as AdminReportDeadline;
  },
  patchDeadline: async (id: string, body: any) => {
    const res = await api.patch(`/admin-reports/deadlines/${id}`, body);
    return unwrap(res) as AdminReportDeadline;
  },
  deleteDeadline: async (id: string) => {
    const res = await api.delete(`/admin-reports/deadlines/${id}`);
    return unwrap(res);
  },

  // --- Dashboard ---
  getDashboard: async (academicYearId?: string) => {
    const res = await api.get("/admin-reports/dashboard", { params: { academicYearId } });
    return unwrap(res);
  },

  // --- Institutional (CAP/AE) ---
  getInstitutionalStatus: async () => {
    const res = await api.get("/admin-reports/institutional/status");
    return unwrap(res);
  },
  enableInstitutional: async () => {
    const res = await api.post("/admin-reports/institutional/enable");
    return unwrap(res);
  },
  disableInstitutional: async () => {
    const res = await api.post("/admin-reports/institutional/disable");
    return unwrap(res);
  },
  getConsolidated: async (academicYearId?: string) => {
    const res = await api.get("/admin-reports/institutional/consolidated", {
      params: { academicYearId },
    });
    return unwrap(res);
  },
};

// ============================================================
// Helpers UI
// ============================================================

export const REPORT_STATUS_LABELS: Record<AdminReportStatus, string> = {
  NON_PREPARE: "Non préparé",
  BROUILLON: "Brouillon",
  EN_VERIFICATION: "En vérification",
  A_VALIDER: "À valider",
  VALIDE: "Validé",
  PRET_A_TRANSMETTRE: "Prêt à transmettre",
  TRANSMIS: "Transmis",
  RECEPTION_CONFIRMEE: "Réception confirmée",
  A_CORRIGER: "À corriger",
  NOUVELLE_VERSION_REQUISE: "Nouvelle version requise",
  CLOTURE: "Clôturé",
};

export const REPORT_STATUS_COLORS: Record<AdminReportStatus, string> = {
  NON_PREPARE: "bg-gray-100 text-gray-700",
  BROUILLON: "bg-yellow-100 text-yellow-800",
  EN_VERIFICATION: "bg-blue-100 text-blue-800",
  A_VALIDER: "bg-indigo-100 text-indigo-800",
  VALIDE: "bg-green-100 text-green-800",
  PRET_A_TRANSMETTRE: "bg-teal-100 text-teal-800",
  TRANSMIS: "bg-cyan-100 text-cyan-800",
  RECEPTION_CONFIRMEE: "bg-emerald-100 text-emerald-800",
  A_CORRIGER: "bg-orange-100 text-orange-800",
  NOUVELLE_VERSION_REQUISE: "bg-red-100 text-red-800",
  CLOTURE: "bg-slate-200 text-slate-700",
};

export const REPORT_CATEGORY_LABELS: Record<string, string> = {
  RENTREE: "Rentrée scolaire",
  STATISTIQUES: "Statistiques",
  PERSONNEL: "Personnel",
  INFRASTRUCTURES: "Infrastructures",
  SITUATION_ANNUELLE: "Situation annuelle",
  FIN_ANNEE: "Fin d'année",
  EXAMENS: "Examens",
  COMPLEMENTAIRE: "Complémentaire",
};
