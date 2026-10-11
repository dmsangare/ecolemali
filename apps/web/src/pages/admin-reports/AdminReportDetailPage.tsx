import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, FileText, Loader2, Download, Send, CheckCircle2,
  Unlock, AlertCircle, RefreshCw, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminReportsApi,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  REPORT_CATEGORY_LABELS,
} from "@/api/admin-reports";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================
// Helpers de rendu des donnees dynamiques
// ============================================================

function renderValue(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function renderObjectAsTable(obj: any): JSX.Element {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(obj).map(([k, v]) => (
          <tr key={k} className="border-b">
            <td className="p-2 font-medium text-muted-foreground w-1/3">{k}</td>
            <td className="p-2">{renderValue(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderArrayAsTable(arr: any[]): JSX.Element {
  if (!arr.length) return <p className="text-sm text-muted-foreground">Aucune donnée</p>;
  const keys = Array.from(
    new Set(arr.flatMap((row) => (row && typeof row === "object" ? Object.keys(row) : []))),
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {keys.map((k) => (
              <th key={k} className="text-left p-2 font-medium">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arr.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/30">
              {keys.map((k) => (
                <td key={k} className="p-2">{renderValue(row?.[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderDataTree(data: any, depth = 0): JSX.Element {
  if (data === null || data === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (Array.isArray(data)) {
    return renderArrayAsTable(data);
  }
  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (depth === 0) {
      return (
        <div className="space-y-4">
          {entries.map(([k, v]) => (
            <Card key={k}>
              <CardHeader>
                <CardTitle className="text-sm capitalize">{k.replace(/_/g, " ")}</CardTitle>
              </CardHeader>
              <CardContent>{renderDataTree(v, depth + 1)}</CardContent>
            </Card>
          ))}
        </div>
      );
    }
    // Sous-objet : si c'est un objet plat, afficher en table cle/valeur
    if (!Array.isArray(data) && typeof data === "object" && entries.every(([, v]) => typeof v !== "object" || v === null)) {
      return renderObjectAsTable(data);
    }
    // Sinon : afficher en tableau cle/valeur
    return (
      <div className="space-y-3">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="text-xs font-medium text-muted-foreground mb-1">{k}</div>
            {renderDataTree(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  return <span>{renderValue(data)}</span>;
}

// ============================================================
// Page detail
// ============================================================

export function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:update");

  const reportQ = useQuery({
    queryKey: ["admin-reports", "detail", id],
    queryFn: () => adminReportsApi.getReport(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reports", "detail", id] });
    qc.invalidateQueries({ queryKey: ["admin-reports", "list"] });
  };

  // --- Mutations ---
  const regenMut = useMutation({
    mutationFn: () => adminReportsApi.generateReport(id!),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const submitMut = useMutation({
    mutationFn: () => adminReportsApi.submitReport(id!),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const validateMut = useMutation({
    mutationFn: () => adminReportsApi.validateReport(id!),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const unlockMut = useMutation({
    mutationFn: (reason: string) => adminReportsApi.unlockReport(id!, reason),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  // --- Chargement ---
  if (reportQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reportQ.isError || !reportQ.data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 text-sm text-muted-foreground">Rapport introuvable</p>
        <Link to="/admin-reports" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const report = reportQ.data;
  const statusClass = REPORT_STATUS_COLORS[report.status];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Link to="/admin-reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">{report.code}</span>
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusClass}`}>
              {REPORT_STATUS_LABELS[report.status]}
            </span>
            {report.version > 1 && (
              <span className="text-xs text-muted-foreground">Version {report.version}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{report.title}</h1>
          {report.template?.category && (
            <p className="text-sm text-muted-foreground">
              {REPORT_CATEGORY_LABELS[report.template.category] ?? report.template.category}
            </p>
          )}
          {report.bordereauNumber && (
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Bordereau : {report.bordereauNumber}
            </p>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 flex-wrap">
        {report.status === "BROUILLON" && canManage && (
          <>
            <Button
              variant="outline"
              onClick={() => regenMut.mutate()}
              disabled={regenMut.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenMut.isPending ? "animate-spin" : ""}`} />
              Régénérer les données
            </Button>
            <Button
              onClick={() => submitMut.mutate()}
              disabled={submitMut.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Soumettre à vérification
            </Button>
          </>
        )}

        {(report.status === "EN_VERIFICATION" || report.status === "A_VALIDER") && canManage && (
          <Button onClick={() => validateMut.mutate()} disabled={validateMut.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Valider le rapport
          </Button>
        )}

        {(report.status === "VALIDE" || report.status === "TRANSMIS" || report.status === "RECEPTION_CONFIRMEE") && (
          <>
            <a
              href={adminReportsApi.downloadPdf(report.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            </a>
            <a href={adminReportsApi.downloadExcel(report.id)}>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Télécharger Excel
              </Button>
            </a>
          </>
        )}

        {canManage && (report.status === "VALIDE" || report.status === "TRANSMIS" || report.status === "A_CORRIGER") && (
          <Button
            variant="outline"
            onClick={() => {
              const reason = prompt("Motif du déverrouillage (min 5 caractères) :");
              if (reason && reason.trim().length >= 5) {
                unlockMut.mutate(reason);
              } else if (reason !== null) {
                alert("Motif trop court (min 5 caractères)");
              }
            }}
            disabled={unlockMut.isPending}
          >
            <Unlock className="h-4 w-4 mr-2" />
            Déverrouiller
          </Button>
        )}
      </div>

      {/* Données */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Données du rapport</CardTitle>
        </CardHeader>
        <CardContent>
          {report.data && Object.keys(report.data).length > 0 ? (
            renderDataTree(report.data)
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune donnée. Cliquez sur "Régénérer les données" pour pré-remplir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
