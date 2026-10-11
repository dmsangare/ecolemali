import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, FileText, CheckCircle2, Clock, AlertTriangle,
  Calendar, Package, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminReportsApi,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
} from "@/api/admin-reports";

export function AdminReportsDashboardPage() {
  const dashQ = useQuery({
    queryKey: ["admin-reports", "dashboard"],
    queryFn: () => adminReportsApi.getDashboard(),
  });

  if (dashQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Chargement du tableau de bord…
      </div>
    );
  }

  if (dashQ.isError || !dashQ.data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Impossible de charger le tableau de bord.
      </div>
    );
  }

  const d = dashQ.data as any;
  const counts = d.counts ?? {};
  const totals = d.totals ?? {};
  const overdue = d.overdue ?? { count: 0, items: [] };
  const upcoming = d.upcoming ?? { count: 0, items: [] };
  const examDossiers = d.incompleteExamDossiers ?? { count: 0, items: [] };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link to="/admin-reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <LayoutDashboard className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord — Rapports</h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble des rapports et échéances administratives
          </p>
        </div>
      </div>

      {/* Cartes summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total rapports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.totalReports ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Validés + Transmis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totals.validatedOrTransmitted ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Taux d'achèvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totals.completionRate ?? 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              En retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{overdue.count ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Compteurs par statut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rapports par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(counts).map(([status, count]) => {
              const s = status as keyof typeof REPORT_STATUS_LABELS;
              return (
                <span
                  key={status}
                  className={`px-3 py-1.5 text-xs rounded-md ${REPORT_STATUS_COLORS[s] ?? "bg-gray-100"}`}
                >
                  {REPORT_STATUS_LABELS[s] ?? status}: <strong>{count as number}</strong>
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2 colonnes : Retard + Prochaines */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* En retard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Échéances dépassées ({overdue.count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdue.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune échéance dépassée.</p>
            ) : (
              <div className="space-y-2">
                {overdue.items.map((item: any) => (
                  <div key={item.id} className="border-l-4 border-red-500 pl-3 py-1">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Échéance : {new Date(item.deadline).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prochaines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Prochaines échéances ({upcoming.count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune échéance proche.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.items.map((item: any) => (
                  <div key={item.id} className="border-l-4 border-blue-500 pl-3 py-1">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.deadline).toLocaleDateString("fr-FR")}
                      {item.recipient && ` — ${item.recipient}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dossiers examens incomplets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Dossiers d'examens incomplets ({examDossiers.count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {examDossiers.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun dossier incomplet.</p>
          ) : (
            <div className="space-y-2">
              {examDossiers.items.map((d: any) => (
                <div key={d.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {d.session?.label ?? "—"} — {d.class?.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Statut : {d.status}
                      </div>
                    </div>
                    <Link to={`/state-exam-dossiers/${d.id}`}>
                      <Button variant="ghost" size="sm">Ouvrir</Button>
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
