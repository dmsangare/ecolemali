import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studentsApi } from "@/api/students";
import { getErrorMessage } from "@/lib/axios";
import type { StudentDocument } from "@/types/student";

const KEY = "students";

export function useStudentDocumentsList(studentId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "documents", studentId],
    queryFn: (): Promise<StudentDocument[]> => studentsApi.getDocuments(studentId!),
    enabled: !!studentId,
  });
}

export function useAddStudentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string;
      data: {
        type: string;
        fileUrl: string;
        fileName?: string;
        mimeType?: string;
        sizeBytes?: number;
      };
    }) => studentsApi.addDocument(studentId, data),
    onSuccess: () => {
      toast.success("Document ajoute avec succes");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRemoveStudentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      documentId,
    }: {
      studentId: string;
      documentId: string;
    }) => studentsApi.removeDocument(studentId, documentId),
    onSuccess: () => {
      toast.success("Document supprime");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
