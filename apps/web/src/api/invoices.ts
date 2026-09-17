import { api } from "@/lib/axios";
import type { Invoice, FinanceDashboard } from "@/types/finance";

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

  async cancel(id: string, reason: string): Promise<any> {
    const { data } = await api.post(`/invoices/${id}/cancel`, { reason });
    return data.data || data;
  },
};
