import { Link } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  ArrowRight,
  UserX,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KpiCard,
  PageLoader,
  ErrorState,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { useSupervisorDashboard } from "@/hooks/dashboard";

export function SupervisorDashboard() {
  const { data, isLoading, isError, refetch } = useSupervisorDashboard();

  if (isLoading) return <PageLoader label="Chargement des présences..." />;

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Impossible de charger les données"
          description="Une erreur est survenue lors de la récupération des présences."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { todaySessions, absentsCount, absents } = data ?? {
    todaySessions: 0,
    absentsCount: 0,
    absents: [],
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tableau de bord — Surveillant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi des présences et des absences du jour.
          </p>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2">
        <KpiCard
          label="Sessions de présence"
          value={todaySessions}
          hint="Sessions enregistrées aujourd'hui"
          icon={<ClipboardCheck className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Élèves absents"
          value={absentsCount}
          hint="Absences à traiter aujourd'hui"
          icon={<UserX className="h-5 w-5" />}
          accent={absentsCount > 0 ? "danger" : "success"}
        />
      </div>

      {/* Liste des absents */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-sis-warning" />
            Absents du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {absents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Aucune absence"
                description="Tous les élèves sont présents ou aucune session n'a encore été enregistrée."
              />
            </div>
          ) : (
            <div className="divide-y">
              {absents.map((a: any) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 hover:bg-muted/30 transition"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {a.student?.lastName?.toUpperCase()}{" "}
                      {a.student?.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.student?.matricule} · {a.session?.class?.name}
                      {a.session?.startTime && ` · ${a.session.startTime}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="danger" showIcon={false}>
                      Absent
                    </StatusBadge>
                    <Link
                      to={`/students/${a.student?.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Voir <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}