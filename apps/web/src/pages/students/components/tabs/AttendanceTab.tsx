import {
  Calendar, CheckCircle2, XCircle, Clock, TrendingUp, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusBadge } from "@/components/shared";

interface AttendanceTabProps {
  studentId: string;
}

export function AttendanceTab({ studentId }: AttendanceTabProps) {
  // Donnees fictives (a migrer vers le backend plus tard)
  const stats = {
    totalSessions: 0,
    present: 0,
    absent: 0,
    absentJustified: 0,
    late: 0,
    presenceRate: 100,
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Suivi des presences
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Les statistiques se rempliront au fur et a mesure des saisies de presence
              par les enseignants.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Taux de presence */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de presence</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.presenceRate}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Presents</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Absents</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI details */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Presences</p>
            </div>
            <p className="text-2xl font-bold">{stats.present}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-muted-foreground">Absences</p>
            </div>
            <p className="text-2xl font-bold">{stats.absent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-muted-foreground">Justifiees</p>
            </div>
            <p className="text-2xl font-bold">{stats.absentJustified}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-muted-foreground">Retards</p>
            </div>
            <p className="text-2xl font-bold">{stats.late}</p>
          </CardContent>
        </Card>
      </div>

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Historique des presences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalSessions === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-3">
                Aucune session de presence enregistree
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                L historique apparaitra une fois les premieres presences saisies
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {stats.totalSessions} session(s) enregistree(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graphique evolution mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolution mensuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Graphique disponible apres les premieres saisies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
