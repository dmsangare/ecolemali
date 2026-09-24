import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterBar, FilterConfig, SearchInput } from "@/components/shared";
import { api } from "@/lib/axios";
import type { StudentListFilters } from "@/types/student";

interface StudentFiltersProps {
  filters: StudentListFilters;
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
}

export function StudentFilters({ filters, onFilterChange, onReset }: StudentFiltersProps) {
  const { data: classesData } = useQuery({
    queryKey: ["classes", "list", "for-filters"],
    queryFn: async () => {
      const { data } = await api.get("/classes");
      return data.data || data;
    },
  });

  const { data: levelsData } = useQuery({
    queryKey: ["levels", "list", "for-filters"],
    queryFn: async () => {
      const { data } = await api.get("/levels");
      return data.data || data;
    },
  });

  const classes = classesData || [];
  const levels = levelsData || [];

  const levelOptions = useMemo(() => {
    const cycleLabels: Record<string, string> = {
      PREMIER_CYCLE: "Premier cycle (1ere - 6eme)",
      DEUXIEME_CYCLE: "Deuxieme cycle (7eme - 9eme)",
      LYCEE: "Lycee (10eme - 12eme)",
    };

    return levels.map((level: any) => ({
      value: level.id,
      label: level.name,
      group: cycleLabels[level.cycle] || level.cycle,
    }));
  }, [levels]);

  const filterConfigs: FilterConfig[] = [
    {
      key: "classId",
      label: "Classe",
      type: "select",
      placeholder: "Toutes les classes",
      value: filters.classId || "all",
      options: classes.map((c: any) => ({
        value: c.id,
        label: c.name,
      })),
    },
    {
      key: "levelId",
      label: "Niveau",
      type: "select",
      placeholder: "Tous les niveaux",
      value: filters.levelId || "all",
      options: levelOptions,
    },
    {
      key: "cycle",
      label: "Cycle",
      type: "select",
      placeholder: "Tous les cycles",
      value: filters.cycle || "all",
      options: [
        { value: "PREMIER_CYCLE", label: "Premier cycle (1ere - 6eme)" },
        { value: "DEUXIEME_CYCLE", label: "Deuxieme cycle (7eme - 9eme)" },
        { value: "LYCEE", label: "Lycee (10eme - 12eme)" },
      ],
    },
    {
      key: "gender",
      label: "Sexe",
      type: "select",
      placeholder: "Tous",
      value: filters.gender || "all",
      options: [
        { value: "M", label: "Masculin" },
        { value: "F", label: "Feminin" },
      ],
    },
    {
      key: "ageRange",
      label: "Age",
      type: "select",
      placeholder: "Tous les ages",
      value: filters.ageRange || "all",
      options: [
        { value: "5-7", label: "5-7 ans" },
        { value: "8-10", label: "8-10 ans" },
        { value: "11-13", label: "11-13 ans" },
        { value: "14-16", label: "14-16 ans" },
        { value: "17+", label: "17 ans et +" },
      ],
    },
    {
      key: "status",
      label: "Statut",
      type: "select",
      placeholder: "Tous les statuts",
      value: filters.status || "all",
      options: [
        { value: "ACTIVE", label: "Actif" },
        { value: "TRANSFERRED", label: "Transfere" },
        { value: "GRADUATED", label: "Diplome" },
        { value: "DROPPED", label: "Abandon" },
        { value: "SUSPENDED", label: "Suspendu" },
      ],
    },
    {
      key: "enrollmentStatus",
      label: "Nouveaute",
      type: "select",
      placeholder: "Tous",
      value: filters.enrollmentStatus || "all",
      options: [
        { value: "NOUVEAU", label: "Nouveaux (cette annee)" },
        { value: "ANCIEN", label: "Anciens (deja la)" },
        { value: "REDOUBLANT", label: "Redoublants" },
      ],
    },
  ];

  return (
    <FilterBar
      filters={filterConfigs}
      onFilterChange={onFilterChange}
      onReset={onReset}
      searchSlot={
        <SearchInput
          value={filters.q || ""}
          onChange={(value) => onFilterChange("q", value)}
          placeholder="Rechercher par nom, prenom, matricule, telephone..."
        />
      }
    />
  );
}
