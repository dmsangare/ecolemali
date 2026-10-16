import { api } from "@/lib/axios";

export interface StudentAccount {
  id: string;
  studentId: string;
  schoolId: string;
  creditBalance: number;
  debtBalance: number;
  lastCreditAt: string | null;
  lastDebtAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefundInput {
  amount: number;
  note?: string;
}

export interface ApplyCreditInput {
  invoiceId: string;
  amount: number;
}

export const studentAccountsApi = {
  async get(studentId: string): Promise<StudentAccount> {
    const { data } = await api.get(`/students/${studentId}/account`);
    return data.data || data;
  },

  async refund(studentId: string, input: RefundInput): Promise<StudentAccount & { refunded: number }> {
    const { data } = await api.post(`/students/${studentId}/account/refund`, input);
    return data.data || data;
  },

  async applyCredit(studentId: string, input: ApplyCreditInput): Promise<StudentAccount & { applied: number; receiptNumber: string }> {
    const { data } = await api.post(`/students/${studentId}/account/apply-credit`, input);
    return data.data || data;
  },
};
