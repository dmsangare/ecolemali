import { api } from "@/lib/axios";
import type { CashSession } from "@/types/finance";

export interface CashSessionListFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export const cashSessionsApi = {
  async list(filters: CashSessionListFilters = {}): Promise<any> {
    const { data } = await api.get("/cash-sessions", { params: filters });
    return data.data ? data : data;
  },

  async getCurrent(): Promise<CashSession | null> {
    const { data } = await api.get("/cash-sessions/current");
    return data.data || data;
  },

  async getById(id: string): Promise<CashSession> {
    const { data } = await api.get(`/cash-sessions/${id}`);
    return data.data || data;
  },

  async getReport(id: string): Promise<any> {
    const { data } = await api.get(`/cash-sessions/${id}/report`);
    return data.data || data;
  },

  async open(input: { schoolId: string; cashierId: string; openingAmount: number }): Promise<CashSession> {
    const { data } = await api.post("/cash-sessions/open", input);
    return data.data || data;
  },

  async close(id: string, closingAmount: number): Promise<CashSession> {
    const { data } = await api.post(`/cash-sessions/${id}/close`, { closingAmount });
    return data.data || data;
  },
};
