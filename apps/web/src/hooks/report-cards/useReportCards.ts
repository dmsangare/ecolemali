import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportCardsApi, type ReportCardFilters } from "@/api/report-cards";
import { getErrorMessage } from "@/lib/axios";
import type {
  GenerateReportCardsInput,
  UpdateReportCardInput,
} from "@/types/report-cards";

const KEY = "report-cards";

export function useReportCards(filters: ReportCardFilters = {}) {
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

export function useGenerateReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateReportCardsInput) => reportCardsApi.generate(input),
    onSuccess: (result: any) => {
      const count = result?.count || result?.length || 0;
      toast.success(`${count} bulletin(s) genere(s) avec succes`);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateReportCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReportCardInput }) =>
      reportCardsApi.update(id, input),
    onSuccess: () => {
      toast.success("Bulletin mis a jour");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useValidateReportCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportCardsApi.validate(id),
    onSuccess: () => {
      toast.success("Bulletin valide");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
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
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function usePublishClassReports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, termId }: { classId: string; termId: string }) =>
      reportCardsApi.publishByClass(classId, termId),
    onSuccess: (result: any) => {
      const count = result?.count || result?.length || 0;
      toast.success(`${count} bulletin(s) publie(s)`);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteReportCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportCardsApi.remove(id),
    onSuccess: () => {
      toast.success("Bulletin supprime");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
