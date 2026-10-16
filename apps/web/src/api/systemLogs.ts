import { api } from "@/lib/axios";

export interface SystemLogEntry {
  id: string;
  level: "ERROR" | "WARN" | "INFO" | "DEBUG";
  module: string | null;
  message: string;
  context: any;
  createdAt: string;
}

export interface SystemLogsFilters {
  level?: string;
  module?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface SystemLogsResponse {
  items: SystemLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export const systemLogsApi = {
  async list(filters: SystemLogsFilters = {}): Promise<SystemLogsResponse> {
    const { data } = await api.get("/system-logs", { params: filters });
    if (Array.isArray(data.data) && data.meta) {
      return {
        items: data.data,
        total: data.meta.total ?? data.data.length,
        page: data.meta.page ?? 1,
        limit: data.meta.limit ?? 50,
      };
    }
    return {
      items: data.items || data.data || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 50,
    };
  },
};
