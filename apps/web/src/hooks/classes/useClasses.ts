import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classesApi } from "@/api/classes";
import { getErrorMessage } from "@/lib/axios";
import type { CreateClassInput, LevelCycle, ClassListFilters } from "@/types/class";

const KEY = "classes";
const KEY_LEVELS = "levels";
const KEY_ROOMS = "rooms";
const KEY_TEACHERS = "teachers";
const KEY_AY = "academic-years";

// ============================================================
// CLASSES
// ============================================================

export function useClasses(filters: ClassListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => classesApi.list(filters),
  });
}

export function useClass(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => classesApi.getById(id!),
    enabled: !!id,
  });
}

export function useClassDashboard(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "dashboard", id],
    queryFn: () => classesApi.getDashboard(id!),
    enabled: !!id,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClassInput) => classesApi.create(input),
    onSuccess: () => {
      toast.success("Classe creee avec succes");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY_LEVELS] }); // refresh _count.classes
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateClassInput>;
    }) => classesApi.update(id, input),
    onSuccess: (_, variables) => {
      toast.success("Classe mise a jour");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, "detail", variables.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.remove(id),
    onSuccess: () => {
      toast.success("Classe supprimee");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY_LEVELS] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ============================================================
// NIVEAUX (Levels) — filtrable par cycle
// ============================================================

export function useLevels(cycle?: LevelCycle) {
  return useQuery({
    queryKey: [KEY_LEVELS, "list", cycle || "all"],
    queryFn: () => classesApi.listLevels(cycle),
    staleTime: 5 * 60_000, // 5 min : change rarement
  });
}

// ============================================================
// SALLES (Rooms)
// ============================================================

export function useRooms() {
  return useQuery({
    queryKey: [KEY_ROOMS, "list"],
    queryFn: () => classesApi.listRooms(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; type: string; capacity?: number; location?: string }) =>
      classesApi.createRoom(input),
    onSuccess: () => {
      toast.success("Salle creee");
      qc.invalidateQueries({ queryKey: [KEY_ROOMS] });
    },
    onError: (error: any) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; type?: string; capacity?: number; location?: string };
    }) => classesApi.updateRoom(id, input),
    onSuccess: () => {
      toast.success("Salle mise a jour");
      qc.invalidateQueries({ queryKey: [KEY_ROOMS] });
    },
    onError: (error: any) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.removeRoom(id),
    onSuccess: () => {
      toast.success("Salle supprimee");
      qc.invalidateQueries({ queryKey: [KEY_ROOMS] });
    },
    onError: (error: any) => toast.error(getErrorMessage(error)),
  });
}

// ============================================================
// ENSEIGNANTS (Teachers)
// ============================================================

export function useTeachers() {
  return useQuery({
    queryKey: [KEY_TEACHERS, "list"],
    queryFn: () => classesApi.listTeachers(),
    staleTime: 5 * 60_000,
  });
}

// ============================================================
// ANNEES SCOLAIRES (Academic Years)
// ============================================================

export function useAcademicYears() {
  return useQuery({
    queryKey: [KEY_AY, "list"],
    queryFn: () => classesApi.listAcademicYears(),
    staleTime: 10 * 60_000, // 10 min
  });
}

export function useCurrentAcademicYear() {
  return useQuery({
    queryKey: [KEY_AY, "current"],
    queryFn: () => classesApi.getCurrentAcademicYear(),
    staleTime: 10 * 60_000,
  });
}
