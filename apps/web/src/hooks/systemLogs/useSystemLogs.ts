import { useQuery } from "@tanstack/react-query";
import { systemLogsApi, type SystemLogsFilters } from "@/api/systemLogs";

const KEY = "system-logs";

export function useSystemLogs(filters: SystemLogsFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => systemLogsApi.list(filters),
    staleTime: 30_000,
  });
}
