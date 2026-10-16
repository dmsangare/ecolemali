import { api } from "@/lib/axios";
import type { Invoice, FinanceDashboard, InvoiceInstallment } from "@/types/finance";

export interface PendingInstallment {
  id: string;
  invoiceId: string;
  label: string;
  amount: number;
  paidAmount: number;
  dueDate: string | null;
  status: string;
  orderIndex: number;
  invoice: {
    id: string;
    number: string;
    status: string;
    balance: number;
    student: {
      id: string;
      matricule: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface InvoiceListFilters {
  page?: number;
  limit?: number;
  q?: string;
  studentId?: string;
  status?: string;
  academicYearId?: string;
}

export const invoicesApi = {
  async list(filters: InvoiceListFilters = {}): Promise<any> {
    const { data } = await api.get("/invoices", { params: filters });
    return data.data ? data : data;
  },

  async getById(id: string): Promise<Invoice> {
    const { data } = await api.get(`/invoices/${id}`);
    return data.data || data;
  },

  async getDashboard(academicYearId?: string): Promise<FinanceDashboard> {
    const { data } = await api.get("/invoices/dashboard", {
      params: { academicYearId },
    });
    return data.data || data;
  },

  async create(input: any): Promise<Invoice> {
    const { data } = await api.post("/invoices", input);
    return data.data || data;
  },

  async autoInvoice(studentId: string, academicYearId: string): Promise<Invoice> {
    const { data } = await api.post(`/invoices/auto/${studentId}/year/${academicYearId}`);
    return data.data || data;
  },

  async cancel(id: string, dto: { reason: string }): Promise<any> {
    const { data } = await api.post(`/invoices/${id}/cancel`, dto);
    return data.data || data;
  },

  async previewAutoInvoiceBulk(input: {
    academicYearId: string;
    levelId?: string;
    classId?: string;
  }): Promise<{ total: number; alreadyInvoiced: number; toCreate: number }> {
    const { data } = await api.post("/invoices/auto/bulk/preview", input);
    return data.data || data;
  },

  async autoInvoiceBulk(input: {
    academicYearId: string;
    levelId?: string;
    classId?: string;
  }): Promise<{
    total: number;
    created: number;
    skipped: number;
    failed: number;
    errors: { studentId: string; message: string }[];
  }> {
    const { data } = await api.post("/invoices/auto/bulk", input);
    return data.data || data;
  },

  async getInstallments(invoiceId: string): Promise<InvoiceInstallment[]> {
    const { data } = await api.get(`/invoices/${invoiceId}/installments`);
    return data.data || data;
  },

  async getPendingInstallments(filters: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<PendingInstallment[]> {
    const { data } = await api.get("/installments/pending", {
      params: filters,
    });
    return data.data || data;
  },
};
