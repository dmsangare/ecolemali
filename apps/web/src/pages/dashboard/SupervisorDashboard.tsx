import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  UserX,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useSupervisorDashboard } from "@/hooks/dashboard";
import { TopStudentsPodium } from "@/components/dashboard";

export function SupervisorDashboard() {
  const { data, isLoading } = useSupervisorDashboard();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { todaySessions = 0, absentsCount = 0, absents = [] } = data || {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi des presences et discipline
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions aujourd'hui
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Appels enregistres
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absents du jour
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {absentsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Élèves absents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actions
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <Link
              to="/attendance"
              className="text-sm font-medium text-primary hover:underline"
            >
              Voir les presences →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Absents du jour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Absents d'aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          {absents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun absent enregistré aujourd'hui
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-3 py-2">Élève</th>
                    <th className="px-3 py-2">Matricule</th>
                    <th className="px-3 py-2">Classe</th>
                    <th className="px-3 py-2">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {absents.map((a: any) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        {a.student?.lastName} {a.student?.firstName}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {a.student?.matricule}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {a.session?.class?.name || "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {a.session?.startTime || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top élèves */}
      <TopStudentsPodium />
    </div>
  );
}
