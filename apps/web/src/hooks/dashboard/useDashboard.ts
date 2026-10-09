import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";

const KEY = "dashboard";

export function useTopStudents() {
  return useQuery({
    queryKey: [KEY, "top-students"],
    queryFn: () => dashboardApi.getTopStudents(),
    staleTime: 5 * 60_000, // 5 min
  });
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: [KEY, "teacher"],
    queryFn: () => dashboardApi.getTeacherDashboard(),
    staleTime: 2 * 60_000,
  });
}

export function useSupervisorDashboard() {
  return useQuery({
    queryKey: [KEY, "supervisor"],
    queryFn: () => dashboardApi.getSupervisorDashboard(),
    staleTime: 2 * 60_000,
  });
}

export function useSecretaryDashboard() {
  return useQuery({
    queryKey: [KEY, "secretary"],
    queryFn: () => dashboardApi.getSecretaryDashboard(),
    staleTime: 2 * 60_000,
  });
}

export function useHonorRoll(termId?: string, cycle?: string) {
  return useQuery({
    queryKey: [KEY, "honor-roll", termId ?? null, cycle ?? null],
    queryFn: () => dashboardApi.getHonorRoll(termId, cycle),
    staleTime: 5 * 60_000, // 5 min
  });
}