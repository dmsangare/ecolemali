export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CHECK" | "MOBILE_MONEY" | "OTHER";
export type CashStatus = "OPEN" | "CLOSED";

export interface Invoice {
  id: string;
  schoolId: string;
  studentId: string;
  academicYearId: string;
  number: string;
  issuedAt: string;
  dueDate?: string | null;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  cancelledAt?: string | null;
  student?: { id: string; matricule: string; firstName: string; lastName: string };
  academicYear?: { id: string; label: string };
  items?: Array<{
    id: string;
    description?: string | null;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
    feeType: { id: string; code: string; name: string; category: string };
  }>;
  payments?: Payment[];
  _count?: { items: number; payments: number };
}

export interface Payment {
  id: string;
  schoolId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paidAt: string;
  cashierId?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  student?: { id: string; matricule: string; firstName: string; lastName: string };
  invoice?: { id: string; number: string; totalAmount: number; balance: number };
  receipt?: { id: string; number: string } | null;
  cashier?: { id: string; firstName: string; lastName: string } | null;
}

export interface CashSession {
  id: string;
  schoolId: string;
  cashierId: string;
  openedAt: string;
  closedAt?: string | null;
  openingAmount: number;
  closingAmount?: number | null;
  expectedAmount?: number | null;
  difference?: number | null;
  status: CashStatus;
}

export interface FinanceDashboard {
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  invoicesCount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  overdueCount: number;
}

export interface CreatePaymentInput {
  schoolId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  cashierId: string;
}
