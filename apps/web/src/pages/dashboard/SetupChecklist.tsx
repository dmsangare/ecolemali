import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  done: boolean;
  actionLabel?: string;
  actionTo?: string;
}

export function SetupChecklist() {
  // Charger l'etat de chaque etape en parallele
  const { data: school } = useQuery({
    queryKey: ["setup-school"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/schools");
        const list = data.data || data;
        return Array.isArray(list) ? list[0] : list;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: academicYears } = useQuery({
    queryKey: ["setup-academic-years"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/academic-years");
        return (data.data || data) as any[];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: terms } = useQuery({
    queryKey: ["setup-terms"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/terms");
        return (data.data || data) as any[];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: levels } = useQuery({
    queryKey: ["setup-levels"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/levels");
        return (data.data || data) as any[];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: classes } = useQuery({
    queryKey: ["setup-classes"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/classes");
        return (data.data || data) as any[];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: users } = useQuery({
    queryKey: ["setup-users"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/users");
        return (data.data || data) as any[];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: feeTypes } = useQuery({
    queryKey: ["setup-fee-types"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/fee-types");
        return (data.data || data) as any[];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: students } = useQuery({
    queryKey: ["setup-students"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/students", {
          params: { limit: 1 },
        });
        const meta = (data as any)?.meta;
        return meta?.total ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 5 * 60_000,
  });

  const { data: reportCards } = useQuery({
    queryKey: ["setup-report-cards"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/report-cards", {
          params: { limit: 1 },
        });
        const list = (data as any)?.data || data;
        return Array.isArray(list) ? list.length : 0;
      } catch {
        return 0;
      }
    },
    staleTime: 5 * 60_000,
  });

  // Determiner l'etat de chaque etape
  const steps: Step[] = [
    {
      id: "school",
      label: "Informations de l'ecole",
      done: !!school && !!school.name,
      actionLabel: "Configurer",
      actionTo: "/settings",
    },
    {
      id: "academic-year",
      label: "Annee scolaire 2026-2027",
      done: !!academicYears && academicYears.length > 0,
      actionLabel: "Creer",
      actionTo: "/settings",
    },
    {
      id: "terms",
      label: "Trimestres / semestres",
      done: !!terms && terms.length > 0,
      actionLabel: "Creer",
      actionTo: "/settings",
    },
    {
      id: "levels",
      label: "Niveaux et classes",
      done:
        (!!levels && levels.length > 0) &&
        (!!classes && classes.length > 0),
      actionLabel: "Configurer",
      actionTo: "/classes",
    },
    {
      id: "users",
      label: "Utilisateurs",
      done: !!users && users.length > 1,
      actionLabel: "Ajouter",
      actionTo: "/settings",
    },
    {
      id: "fees",
      label: "Tarifs de scolarite",
      done: !!feeTypes && feeTypes.length > 0,
      actionLabel: "Configurer",
      actionTo: "/fee-types",
    },
    {
      id: "students",
      label: "Importer les eleves",
      done: typeof students === "number" && students > 0,
      actionLabel: "Importer",
      actionTo: "/students/import",
    },
    {
      id: "report-cards",
      label: "Premier bulletin",
      done: typeof reportCards === "number" && reportCards > 0,
      actionLabel: "Voir",
      actionTo: "/report-cards",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  // Si tout est fait, on cache le bloc
  if (completedCount === totalSteps) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          Assistant de demarrage
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Completez ces etapes pour configurer votre ecole
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {completedCount} etape{completedCount > 1 ? "s" : ""} sur {totalSteps} terminee{completedCount > 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground">{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Liste des etapes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                step.done
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20"
                  : "bg-background",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    "truncate",
                    step.done && "text-muted-foreground line-through",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!step.done && step.actionLabel && step.actionTo && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 px-2 text-xs"
                >
                  <Link to={step.actionTo}>
                    {step.actionLabel}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
