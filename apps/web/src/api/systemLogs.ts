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

    // Structure possible 1 : { data: { items: [], total: N, page, limit } }
    if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
      return {
        items: Array.isArray(data.data.items) ? data.data.items : [],
        total: data.data.total ?? 0,
        page: data.data.page ?? 1,
        limit: data.data.limit ?? 50,
      };
    }

    // Structure possible 2 : { data: [...], meta: {...} } (comme audit)
    if (Array.isArray(data.data)) {
      return {
        items: data.data,
        total: data.meta?.total ?? data.data.length,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 50,
      };
    }

    // Structure possible 3 : { items: [], total: N } direct
    if (Array.isArray(data.items)) {
      return {
        items: data.items,
        total: data.total ?? 0,
        page: data.page ?? 1,
        limit: data.limit ?? 50,
      };
    }

    // Fallback ultime
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 50,
    };
  },
};
