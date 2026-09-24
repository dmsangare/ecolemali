import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enrollmentsApi, type CreateEnrollmentInput } from "@/api/enrollments";
import { getErrorMessage } from "@/lib/axios";

const KEY = "enrollments";

export function useEnrollments(params?: {
  classId?: string;
  studentId?: string;
  academicYearId?: string;
}) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => enrollmentsApi.list(params),
    enabled: !!(params?.classId || params?.studentId || params?.academicYearId),
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEnrollmentInput) => enrollmentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCancelEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      enrollmentsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Eleve retire de la classe");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
