import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  attendanceApi,
  AttendanceSessionListFilters,
} from "@/api/attendance";
import { getErrorMessage } from "@/lib/axios";
import type { CreateAttendanceInput } from "@/types/attendance";

const KEY = "attendance";

export function useAttendanceSessions(filters: AttendanceSessionListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "sessions", filters],
    queryFn: () => attendanceApi.listSessions(filters),
  });
}

export function useAttendanceSession(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "session", id],
    queryFn: () => attendanceApi.getSession(id!),
    enabled: !!id,
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAttendanceInput) => attendanceApi.createSession(input),
    onSuccess: () => {
      toast.success("Session de presence creee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAttendanceRecords() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, records }: { sessionId: string; records: any[] }) =>
      attendanceApi.updateRecords(sessionId, records),
    onSuccess: () => {
      toast.success("Presences mises a jour");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useJustifyAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, justification }: { recordId: string; justification: string }) =>
      attendanceApi.justifyRecord(recordId, justification),
    onSuccess: () => {
      toast.success("Absence justifiee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useTodayAbsences() {
  return useQuery({
    queryKey: [KEY, "today-absences"],
    queryFn: () => attendanceApi.getTodayAbsences(),
  });
}
