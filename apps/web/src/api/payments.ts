import { api } from "@/lib/axios";
import type { Payment, CreatePaymentInput } from "@/types/finance";

export interface SettleFamilyInput {
  guardianId: string;
  amount: number;
  method: "CASH" | "TRANSFER" | "CHECK" | "MOBILE_MONEY" | "OTHER";
  reference?: string;
  idempotencyKey?: string;
  note?: string;
}

export interface SettleAllInput {
  invoiceId: string;
  studentId: string;
  amount: number;
  method: "CASH" | "TRANSFER" | "CHECK" | "MOBILE_MONEY" | "OTHER";
  reference?: string;
}

export interface SettleFamilyResult {
  totalApplied: number;
  remainingCredit: number;
  payments: Array<{ id: string; amount: number; invoiceId: string; receiptNumber?: string }>;
}

export interface SettleAllResult {
  totalApplied: number;
  remainingCredit: number;
  payments: Array<{ id: string; amount: number; invoiceId: string; receiptNumber?: string }>;
}

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

  /**
   * Encaissement pour toute la famille : repartit le montant en FIFO
   * sur toutes les factures impayees des enfants du tuteur.
   */
  async settleFamily(input: SettleFamilyInput): Promise<SettleFamilyResult> {
    const { data } = await api.post("/payments/family", input);
    return data.data || data;
  },

  /**
   * Solde plusieurs echeances d'une meme facture en FIFO
   * avec un seul montant.
   */
  async settleAll(input: SettleAllInput): Promise<SettleAllResult> {
    const { data } = await api.post("/payments/settle-all", input);
    return data.data || data;
  },
};
