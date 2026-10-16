import { useQuery } from "@tanstack/react-query";
import { auditApi, type AuditListFilters } from "@/api/audit";

const KEY = "audit-logs";

export function useAuditLogs(filters: AuditListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => auditApi.list(filters),
    staleTime: 30_000,
  });
}

export function useAuditLog(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => auditApi.findOne(id!),
    enabled: !!id,
  });
}
