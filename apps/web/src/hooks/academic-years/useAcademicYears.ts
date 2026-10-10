import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { academicYearsApi } from "@/api/academic-years";
import { getErrorMessage } from "@/lib/axios";

const KEY = "academic-years";

// ============================================================
// QUERIES
// ============================================================

export function useAcademicYearsList() {
  return useQuery({
    queryKey: [KEY, "list"],
    queryFn: () => academicYearsApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useAcademicYear(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => academicYearsApi.getById(id!),
    enabled: !!id,
  });
}

export function useClosingSummary(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "closing-summary", id],
    queryFn: () => academicYearsApi.getClosingSummary(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ============================================================
// MUTATIONS
// ============================================================

export function useActivateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicYearsApi.activate(id),
    onSuccess: (year) => {
      toast.success(`Annee ${year.label} activee`);
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCloseAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicYearsApi.close(id),
    onSuccess: (year) => {
      toast.success(`Annee ${year.label} cloturee`);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useArchiveAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicYearsApi.archive(id),
    onSuccess: (year) => {
      toast.success(`Annee ${year.label} archivee`);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof academicYearsApi.create>[0]) =>
      academicYearsApi.create(payload),
    onSuccess: (year) => {
      toast.success(`Annee ${year.label} creee`);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicYearsApi.remove(id),
    onSuccess: () => {
      toast.success("Annee supprimee");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
