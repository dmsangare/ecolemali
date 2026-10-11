import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, Plus, RefreshCw, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminReportsApi,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  REPORT_CATEGORY_LABELS,
  type AdminReportStatus,
} from "@/api/admin-reports";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_FILTERS: { value: "" | AdminReportStatus; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "BROUILLON", label: "Brouillons" },
  { value: "EN_VERIFICATION", label: "En vérification" },
  { value: "VALIDE", label: "Validés" },
  { value: "TRANSMIS", label: "Transmis" },
  { value: "RECEPTION_CONFIRMEE", label: "Réceptionnés" },
];

export function AdminReportsListPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"" | AdminReportStatus>("");

  const canManage = hasPermission("report_card:create");

  // --- Liste des rapports ---
  const reportsQ = useQuery({
    queryKey: ["admin-reports", "list", statusFilter],
    queryFn: () =>
      adminReportsApi.listReports(statusFilter ? { status: statusFilter } : undefined),
  });

  // --- Seed templates ---
  const seedMut = useMutation({
    mutationFn: () => adminReportsApi.seed(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  // --- Templates (pour le bouton nouveau) ---
  const templatesQ = useQuery({
    queryKey: ["admin-reports", "templates"],
    queryFn: () => adminReportsApi.listTemplates(),
  });

  const reports = reportsQ.data ?? [];
  const templates = templatesQ.data ?? [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rapports administratifs</h1>
            <p className="text-sm text-muted-foreground">
              Préparation, validation et transmission des rapports aux autorités
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && canManage && (
            <Button
              variant="outline"
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${seedMut.isPending ? "animate-spin" : ""}`} />
              Initialiser les modèles
            </Button>
          )}
          {canManage && (
            <Link to="/admin-reports/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rapport
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Alerte si pas de modèles */}
      {templates.length === 0 && !templatesQ.isLoading && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Aucun modèle de rapport</p>
              <p className="text-sm text-amber-800 mt-1">
                Cliquez sur "Initialiser les modèles" pour créer les 5 modèles internes
                (rentrée, statistiques, personnel, infrastructures, situation annuelle).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {reports.length} rapport{reports.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsQ.isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement…</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun rapport pour le moment.
              </p>
              {canManage && (
                <Link to="/admin-reports/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier rapport
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Code</th>
                    <th className="text-left p-2 font-medium">Titre</th>
                    <th className="text-left p-2 font-medium">Catégorie</th>
                    <th className="text-left p-2 font-medium">Statut</th>
                    <th className="text-center p-2 font-medium">Version</th>
                    <th className="text-left p-2 font-medium">Bordereau</th>
                    <th className="text-right p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">{r.code}</td>
                      <td className="p-2">
                        <Link
                          to={`/admin-reports/${r.id}`}
                          className="font-medium hover:underline"
                        >
                          {r.title}
                        </Link>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {r.template?.category
                          ? REPORT_CATEGORY_LABELS[r.template.category] ?? r.template.category
                          : "—"}
                      </td>
                      <td className="p-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${REPORT_STATUS_COLORS[r.status]}`}
                        >
                          {REPORT_STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="p-2 text-center">{r.version}</td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">
                        {r.bordereauNumber ?? "—"}
                      </td>
                      <td className="p-2 text-right">
                        <Link to={`/admin-reports/${r.id}`}>
                          <Button variant="ghost" size="sm">
                            Ouvrir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
