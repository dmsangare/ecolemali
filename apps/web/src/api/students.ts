import { api } from "@/lib/axios";
import type {
  Student,
  StudentListFilters,
  PaginatedStudents,
  CreateStudentInput,
  StudentStats,
  StudentDocument,
} from "@/types/student";

export const studentsApi = {
  async list(filters: StudentListFilters = {}): Promise<PaginatedStudents> {
    const { data } = await api.get("/students", { params: filters });
    return data.data ? data : data;
  },

  async getById(id: string): Promise<Student> {
    const { data } = await api.get(`/students/${id}`);
    return data.data || data;
  },

  async create(input: CreateStudentInput): Promise<Student> {
    const { data } = await api.post("/students", input);
    return data.data || data;
  },

  async update(id: string, input: Partial<CreateStudentInput>): Promise<Student> {
    const { data } = await api.patch(`/students/${id}`, input);
    return data.data || data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async getStats(): Promise<StudentStats> {
    const { data } = await api.get("/students/stats");
    return data.data || data;
  },

  async getPathway(id: string): Promise<any[]> {
    const { data } = await api.get(`/students/${id}/pathway`);
    return data.data || data;
  },

  async getSiblings(id: string): Promise<Student[]> {
    const { data } = await api.get(`/students/${id}/siblings`);
    return data.data || data;
  },

  // ============================================================
  // DOCUMENTS
  // ============================================================

  async getDocuments(id: string): Promise<StudentDocument[]> {
    const { data } = await api.get(`/students/${id}/documents`);
    return data.data || data;
  },

  async addDocument(
    studentId: string,
    documentData: {
      type: string;
      fileUrl: string;
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
    },
  ): Promise<StudentDocument> {
    const { data } = await api.post(`/students/${studentId}/documents`, documentData);
    return data.data || data;
  },

  async removeDocument(studentId: string, documentId: string): Promise<void> {
    await api.delete(`/students/${studentId}/documents/${documentId}`);
  },

  // ============================================================
  // EXPORT
  // ============================================================


  async getInvoices(id: string): Promise<any[]> {
    const { data } = await api.get(`/students/${id}/invoices`);
    return data.data || data;
  },

  async getPayments(id: string): Promise<any[]> {
    const { data } = await api.get(`/students/${id}/payments`);
    return data.data || data;
  },

  async downloadExport(
    format: "csv" | "excel" | "pdf",
    filters: StudentListFilters = {},
  ): Promise<void> {
    const params: Record<string, any> = {};
    if (filters.classId) params.classId = filters.classId;
    if (filters.levelId) params.levelId = filters.levelId;
    if (filters.status) params.status = filters.status;
    if (filters.enrollmentStatus) params.enrollmentStatus = filters.enrollmentStatus;

    const { data } = await api.get(`/students/export/${format}`, {
      params,
      responseType: "blob",
    });

    const extensions: Record<string, string> = {
      csv: "csv",
      excel: "xlsx",
      pdf: "pdf",
    };
    const mimeTypes: Record<string, string> = {
      csv: "text/csv;charset=utf-8",
      excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pdf: "application/pdf",
    };

    const blob = new Blob([data], { type: mimeTypes[format] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const date = new Date().toISOString().split("T")[0];
    link.download = `eleves-${date}.${extensions[format]}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  // ============================================================
  // CARTES SCOLAIRES (BLOC B)
  // ============================================================

  /**
   * Genere un PDF de cartes scolaires.
   * Fournir SOIT classId, SOIT studentIds[].
   */
  async generateIdCards(options: {
    classId?: string;
    studentIds?: string[];
    format?: "A4" | "PVC";
    includeVerso?: boolean;
  }): Promise<Blob> {
    const { data } = await api.post(
      "/students/id-cards/batch",
      {
        classId: options.classId,
        studentIds: options.studentIds,
        format: options.format || "A4",
        includeVerso: !!options.includeVerso,
      },
      { responseType: "blob", timeout: 120000 },
    );
    return data;
  },

};
