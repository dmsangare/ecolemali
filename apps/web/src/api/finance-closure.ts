import { api } from "@/lib/axios";

// ============================================================
// BLOC H — Client API clôture financiere annuelle
// ============================================================

export interface BalanceEntry {
  studentId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  className: string | null;
  totalBilled: number;
  totalPaid: number;
  balance: number;
}

export interface FinanceClosurePreview {
  year: {
    id: string;
    label: string;
    status: string;
    financeClosedAt: string | null;
    financeClosedBy: string | null;
  };
  totals: {
    invoicesCount: number;
    studentsCount: number;
    totalBilled: number;
    totalDebt: number;
    totalCredit: number;
  };
  debtors: BalanceEntry[];
  creditors: BalanceEntry[];
  settledCount: number;
  blockers: Array<{ type: string; count: number; label: string }>;
  canExecute: boolean;
  alreadyClosed: boolean;
}

export interface ExecuteFinanceClosureInput {
  yearId: string;
  carryOverDebts?: boolean;
  carryOverCredits?: boolean;
  ignoreOpenCashSessions?: boolean;
}

export interface ExecuteFinanceClosureResult {
  yearId: string;
  yearLabel: string;
  nextYearId: string | null;
  nextYearLabel: string | null;
  carriedInvoicesCount: number;
  creditedAccountsCount: number;
  debitedAccountsCount: number;
  totalDebtCarried: number;
  totalCreditCarried: number;
}

export const financeClosureApi = {
  async preview(yearId: string): Promise<FinanceClosurePreview> {
    const { data } = await api.get(`/finance-closure/preview/${yearId}`);
    return data.data || data;
  },

  async execute(input: ExecuteFinanceClosureInput): Promise<ExecuteFinanceClosureResult> {
    const { data } = await api.post("/finance-closure/execute", input);
    return data.data || data;
  },
};
