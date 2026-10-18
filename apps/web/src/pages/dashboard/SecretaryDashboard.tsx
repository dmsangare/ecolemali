import { Link } from "react-router-dom";
import {
  UserPlus,
  Users,
  Loader2,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { useSecretaryDashboard } from "@/hooks/dashboard";
import { TopStudentsPodium } from "@/components/dashboard";

export function SecretaryDashboard() {
  const { data, isLoading } = useSecretaryDashboard();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { todayEnrollments = 0, totalStudents = 0, recentStudents = [] } =
    data || {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion des inscriptions et eleves
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inscriptions aujourd'hui
            </CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nouveaux inscrits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total élèves actifs
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Toutes classes confondues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/students/new">
            <UserPlus className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Nouvel élève</div>
              <div className="text-xs text-muted-foreground">
                Créer une inscription
              </div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/students">
            <Users className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Liste des élèves</div>
              <div className="text-xs text-muted-foreground">
                Consulter / modifier
              </div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/enrollments">
            <FileText className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Inscriptions</div>
              <div className="text-xs text-muted-foreground">
                Gerer les dossiers
              </div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Derniers élèves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Derniers élèves inscrits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun élève enregistre
            </p>
          ) : (
            <div className="space-y-2">
              {recentStudents.map((s: any) => (
                <Link
                  key={s.id}
                  to={`/students/${s.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition"
                >
                  <div>
                    <p className="font-medium">
                      {s.lastName} {s.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
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

      {/* Top élèves */}
      <TopStudentsPodium />
    </div>
  );
}
