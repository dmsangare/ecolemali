import { api } from "@/lib/axios";
import type { Payment, CreatePaymentInput } from "@/types/finance";

export interface PaymentListFilters {
  page?: number;
  limit?: number;
  studentId?: string;
  invoiceId?: string;
  method?: string;
  fromDate?: string;
  toDate?: string;
}

export const paymentsApi = {
  async list(filters: PaymentListFilters = {}): Promise<any> {
    const { data } = await api.get("/payments", { params: filters });
    return data.data ? data : data;
  },

  async getById(id: string): Promise<Payment> {
    const { data } = await api.get(`/payments/${id}`);
    return data.data || data;
  },

  async create(input: CreatePaymentInput): Promise<Payment> {
    const { data } = await api.post("/payments", input);
    return data.data || data;
  },

  async cancel(id: string, reason: string): Promise<any> {
    const { data } = await api.post(`/payments/${id}/cancel`, { reason });
    return data.data || data;
  },

  async getTodayTotal(cashierId?: string): Promise<{ count: number; total: number }> {
    const { data } = await api.get("/payments/today-total", {
      params: { cashierId },
    });
    return data.data || data;
  },
};
