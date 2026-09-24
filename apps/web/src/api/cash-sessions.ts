import { api } from "@/lib/axios";
import type { CashSession } from "@/types/finance";

const unwrap = (res: any) => res?.data?.data ?? res?.data;

export const cashSessionsApi = {
  list: async (params?: any) => {
    const res = await api.get('/cash-sessions/history', { params });
    return unwrap(res);
  },

  getCurrent: async (): Promise<CashSession | null> => {
    const res = await api.get('/cash-sessions/current');
    return unwrap(res);
  },

  getById: async (id: string): Promise<CashSession> => {
    const res = await api.get(`/cash-sessions/${id}`);
    return unwrap(res);
  },

  open: async (input: { openingBalance: number; notes?: string }) => {
    const res = await api.post('/cash-sessions/open', input);
    return unwrap(res);
  },

  close: async (id: string, dto: { closingBalance: number; notes?: string }) => {
    const res = await api.post('/cash-sessions/close', dto);
    return unwrap(res);
  },
};
