import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Clock,
  ArrowRight,
  GraduationCap,
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
} from "@/components/ui";
import { useSecretaryDashboard } from "@/hooks/dashboard";

export function SecretaryDashboard() {
  const { data, isLoading, isError, refetch } = useSecretaryDashboard();

  if (isLoading) return <PageLoader label="Chargement du secrétariat..." />;

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Impossible de charger les données"
          description="Une erreur est survenue lors de la récupération des inscriptions."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { todayEnrollments, totalStudents, recentStudents } = data ?? {
    todayEnrollments: 0,
    totalStudents: 0,
    recentStudents: [],
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tableau de bord — Secrétariat
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi des inscriptions et des nouveaux élèves.
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
          label="Inscriptions aujourd'hui"
          value={todayEnrollments}
          hint="Nouvelles inscriptions enregistrées ce jour"
          icon={<UserPlus className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Élèves actifs"
          value={totalStudents}
          hint="Total des élèves actifs dans l'établissement"
          icon={<Users className="h-5 w-5" />}
          accent="success"
        />
      </div>

      {/* Derniers élèves inscrits */}
      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-sis-brand" />
            Derniers élèves inscrits
          </CardTitle>
          <Link
            to="/students"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Tout voir <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentStudents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Aucun élève inscrit"
                description="Les inscriptions apparaîtront ici dès que vous ajouterez un élève."
              />
            </div>
          ) : (
            <div className="divide-y">
              {recentStudents.map((s: any) => (
                <Link
                  key={s.id}
                  to={`/students/${s.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {s.lastName?.toUpperCase()} {s.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.matricule} ·{" "}
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-2">
        <Link to="/students/new" className="block group">
          <Card className="h-full transition-all group-hover:border-sis-brand group-hover:shadow-sis-md cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sis-brand-50 text-sis-brand">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Inscrire un élève</p>
                <p className="text-xs text-muted-foreground">
                  Ajouter un nouvel élève
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/enrollments" className="block group">
          <Card className="h-full transition-all group-hover:border-sis-brand group-hover:shadow-sis-md cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sis-info-bg text-sis-info">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Inscriptions en cours</p>
                <p className="text-xs text-muted-foreground">
                  Voir toutes les inscriptions
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}