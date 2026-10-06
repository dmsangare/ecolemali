import { api } from "@/lib/axios";

export interface MessageLog {
  id: string;
  schoolId: string;
  studentId?: string | null;
  guardianId?: string | null;
  userId?: string | null;
  invoiceId?: string | null;
  type: "REMINDER" | "RECEIPT" | "INVOICE" | "OTHER";
  channel: "WHATSAPP" | "SMS" | "EMAIL" | "INTERNAL";
  recipientPhone: string;
  recipientName?: string | null;
  message: string;
  status: "SENT" | "FAILED";
  sentAt: string;
  createdAt: string;
  student?: { id: string; firstName: string; lastName: string; matricule: string } | null;
  user?: { id: string; firstName: string; lastName: string } | null;
}

export interface Reminder {
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string | null;
  daysLate: number;
  student: { id: string; firstName: string; lastName: string; matricule: string };
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    relationType?: string;
  } | null;
  lastReminder: {
    id: string;
    sentAt: string;
    channel: string;
    recipientPhone: string;
  } | null;
}

export interface CreateMessageInput {
  studentId?: string;
  guardianId?: string;
  invoiceId?: string;
  type?: "REMINDER" | "RECEIPT" | "INVOICE" | "OTHER";
  channel?: "WHATSAPP" | "SMS" | "EMAIL" | "INTERNAL";
  recipientPhone: string;
  recipientName?: string;
  message: string;
  status?: "SENT" | "FAILED";
}

export interface MessageListFilters {
  studentId?: string;
  invoiceId?: string;
  type?: string;
  channel?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export const messagesApi = {
  async list(filters: MessageListFilters = {}) {
    const { data } = await api.get("/messages", { params: filters });
    return data.data || data;
  },

  async getReminders(minDaysLate = 0): Promise<{ items: Reminder[]; total: number }> {
    const { data } = await api.get("/messages/reminders", {
      params: { minDaysLate },
    });
    return data.data || data;
  },

  async create(input: CreateMessageInput): Promise<MessageLog> {
    const { data } = await api.post("/messages", input);
    return data.data || data;
  },
};
