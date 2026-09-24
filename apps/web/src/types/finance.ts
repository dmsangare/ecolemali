// ============================================================
// TYPES — MODULE FINANCE (FUSION)
// ============================================================

// ============================================================
// ENUMS
// ============================================================
export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CHECK" | "MOBILE_MONEY" | "OTHER";
export type CashStatus = "OPEN" | "CLOSED";

export type FeeCategory =
  | "INSCRIPTION"
  | "SCOLARITE"
  | "TRANSPORT"
  | "CANTINE"
  | "UNIFORME"
  | "FOURNITURES"
  | "EXAMEN"
  | "AUTRE";

// ============================================================
// INVOICE (facture)
// ============================================================
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
  student?: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
  };
  academicYear?: { id: string; label: string };
  items?: Array<{
    id: string;
    invoiceId: string;
    feeTypeId: string;
    description?: string | null;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
    feeType?: {
      id: string;
      code: string;
      name: string;
      category: FeeCategory;
    };
  }>;
  payments?: Payment[];
  _count?: {
    items: number;
    payments: number;
  };
}

// ============================================================
// PAYMENT (paiement)
// ============================================================
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
  receiptNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice;
  student?: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
  };
  cashier?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface CreatePaymentInput {
  invoiceId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

// ============================================================
// CASH SESSION (caisse)
// ============================================================
export interface CashSession {
  id: string;
  schoolId: string;
  cashierId: string;
  openedAt: string;
  closedAt?: string | null;
  openingAmount: number | string;
  closingAmount?: number | string | null;
  expectedAmount?: number | string | null;
  difference?: number | string | null;
  status: CashStatus;
  createdAt: string;
  updatedAt: string;
  // Champs calcules renvoyes par l'API
  totalCash?: number;
  totalOther?: number;
  totalPayments?: number;
  paymentsCount?: number;
  theoreticalBalance?: number;
  cashier?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    payments: number;
  };
}

// ============================================================
// FINANCE DASHBOARD
// ============================================================
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

// ============================================================
// FEE TYPE (type de frais)
// ============================================================
export interface FeeType {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  category: FeeCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    feeStructures: number;
    invoiceItems: number;
  };
}

export interface CreateFeeTypeInput {
  code: string;
  name: string;
  category: FeeCategory;
  isActive?: boolean;
}

// ============================================================
// FEE STRUCTURE (grille tarifaire)
// ============================================================
export interface FeeStructure {
  id: string;
  schoolId: string;
  academicYearId: string;
  levelId: string | null;
  feeTypeId: string;
  amount: number | string;
  dueDate: string | null;
  installments: number;
  createdAt: string;
  updatedAt: string;
  feeType?: FeeType;
  level?: {
    id: string;
    code: string;
    name: string;
    cycle: string;
  };
  academicYear?: {
    id: string;
    label: string;
  };
}

export interface CreateFeeStructureInput {
  academicYearId: string;
  levelId?: string | null;
  feeTypeId: string;
  amount: number;
  dueDate?: string;
  installments?: number;
}

// ============================================================
// LABELS
// ============================================================
export const FEE_CATEGORY_LABELS: Record<FeeCategory, { label: string; emoji: string; color: string }> = {
  INSCRIPTION: { label: "Inscription", emoji: "🎓", color: "bg-blue-500/10 text-blue-700" },
  SCOLARITE: { label: "Scolarité", emoji: "📚", color: "bg-green-500/10 text-green-700" },
  TRANSPORT: { label: "Transport", emoji: "🚌", color: "bg-orange-500/10 text-orange-700" },
  CANTINE: { label: "Cantine", emoji: "🍽️", color: "bg-purple-500/10 text-purple-700" },
  UNIFORME: { label: "Uniforme", emoji: "👕", color: "bg-pink-500/10 text-pink-700" },
  FOURNITURES: { label: "Fournitures", emoji: "📖", color: "bg-cyan-500/10 text-cyan-700" },
  EXAMEN: { label: "Examen", emoji: "📝", color: "bg-red-500/10 text-red-700" },
  AUTRE: { label: "Autre", emoji: "📦", color: "bg-gray-500/10 text-gray-700" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; emoji: string; color: string }> = {
  CASH: { label: "Espèces", emoji: "💵", color: "bg-green-500/10 text-green-700" },
  TRANSFER: { label: "Virement", emoji: "🏦", color: "bg-blue-500/10 text-blue-700" },
  CHECK: { label: "Chèque", emoji: "📝", color: "bg-purple-500/10 text-purple-700" },
  MOBILE_MONEY: { label: "Mobile Money", emoji: "📱", color: "bg-orange-500/10 text-orange-700" },
  OTHER: { label: "Autre", emoji: "📦", color: "bg-gray-500/10 text-gray-700" },
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, { label: string; color: string }> = {
  UNPAID: { label: "Impayée", color: "bg-red-500/10 text-red-700" },
  PARTIAL: { label: "Partielle", color: "bg-orange-500/10 text-orange-700" },
  PAID: { label: "Payée", color: "bg-green-500/10 text-green-700" },
  OVERDUE: { label: "En retard", color: "bg-red-700/10 text-red-800" },
  CANCELLED: { label: "Annulée", color: "bg-gray-500/10 text-gray-700" },
};

export const CASH_STATUS_LABELS: Record<CashStatus, { label: string; color: string }> = {
  OPEN: { label: "Ouverte", color: "bg-green-500/10 text-green-700" },
  CLOSED: { label: "Clôturée", color: "bg-gray-500/10 text-gray-700" },
};

// ============================================================
// HELPERS
// ============================================================
export function formatFCFA(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0 FCFA";
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "0 FCFA";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}
