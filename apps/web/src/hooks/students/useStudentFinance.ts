import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@/api/students";

const KEY = "students";

export function useStudentInvoices(studentId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "invoices", studentId],
    queryFn: () => studentsApi.getInvoices(studentId!),
    enabled: !!studentId,
  });
}

export function useStudentPayments(studentId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "payments", studentId],
    queryFn: () => studentsApi.getPayments(studentId!),
    enabled: !!studentId,
  });
}
