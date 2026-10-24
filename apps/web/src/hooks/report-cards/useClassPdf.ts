import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

interface GenerateClassPdfInput {
  classId: string;
  academicYearId: string;
  termId?: string;
  kind?: string;
}

interface ClassPdfJob {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  progress: number;
  count?: number;
  error?: string;
}

export function useGenerateClassPdf() {
  return useMutation({
    mutationFn: async (input: GenerateClassPdfInput) => {
      const { classId, ...body } = input;
      const res = await api.post<ClassPdfJob>(`/report-cards/class/${classId}/pdf`, body);
      return res.data;
    },
  });
}

export function useClassPdfStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["class-pdf", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await api.get<ClassPdfJob>(`/report-cards/class-pdf/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      return data.status === "DONE" || data.status === "FAILED" ? false : 3000;
    },
  });
}

export function downloadClassPdf(jobId: string) {
  window.open(`/api/v1/report-cards/class-pdf/${jobId}/download`, "_blank");
}
