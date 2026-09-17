import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportCardsApi, ReportCardListFilters } from "@/api/report-cards";
import { getErrorMessage } from "@/lib/axios";

const KEY = "report-cards";

export function useReportCards(filters: ReportCardListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => reportCardsApi.list(filters),
  });
}

export function useReportCard(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => reportCardsApi.getById(id!),
    enabled: !!id,
  });
}

export function useClassRanking(classId: string | undefined, termId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "ranking", classId, termId],
    queryFn: () => reportCardsApi.getClassRanking(classId!, termId!),
    enabled: !!classId && !!termId,
  });
}

export function useGenerateReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      academicYearId: string;
      termId: string;
      classId?: string;
      studentId?: string;
    }) => reportCardsApi.generate(input),
    onSuccess: () => {
      toast.success("Bulletins generes avec succes");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePublishReportCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportCardsApi.publish(id),
    onSuccess: () => {
      toast.success("Bulletin publie");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
