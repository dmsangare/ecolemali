import { api } from "@/lib/axios";

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  schoolId: string | null;
  action: string;
  module: string;
  objectType: string | null;
  objectId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
}

export interface AuditListFilters {
  page?: number;
  limit?: number;
  userId?: string;
  module?: string;
  action?: string;
  objectType?: string;
  objectId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditListResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export const auditApi = {
  async list(filters: AuditListFilters = {}): Promise<AuditListResponse> {
    const { data } = await api.get("/audit-logs", { params: filters });
    return data.data || data;
  },

  async findOne(id: string): Promise<AuditLogEntry> {
    const { data } = await api.get(`/audit-logs/${id}`);
    return data.data || data;
  },
};
