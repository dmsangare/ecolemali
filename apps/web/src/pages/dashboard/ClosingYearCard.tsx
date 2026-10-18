import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  ArrowRight,
  Calendar,
  FileText,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";

interface ClosingSummary {
  year: { id: string; label: string; status: string; isCurrent: boolean };
  totalStudents: number;
  totalClasses: number;
  pendingEnrollments: number;
  unpaidInvoices: number;
  openCashSessions: number;
  draftReportCards: number;
  blockers: Array<{ type: string; count: number; label: string; severity: string }>;
  warnings: Array<{ type: string; count: number; label: string }>;
  canClose: boolean;
}

export function ClosingYearCard() {
  const { data: years } = useQuery({
    queryKey: ["academic-years-closing"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return (data.data || data) as any[];
    },
    staleTime: 5 * 60_000,
  });

  const currentYear = years?.find((y: any) => y.isCurrent) || years?.[0];

  const { data: summary, isLoading } = useQuery({
    queryKey: ["academic-years", "closing-summary", currentYear?.id],
    queryFn: async () => {
      const { data } = await api.get(
        `/academic-years/${currentYear.id}/closing-summary`,
      );
      return (data.data || data) as ClosingSummary;
    },
    enabled: !!currentYear?.id,
    staleTime: 2 * 60_000,
  });

  if (!currentYear) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const hasBlockers = summary.blockers.length > 0;
  const hasWarnings = summary.warnings.length > 0;

  return (
    <Card
      className={cn(
        hasBlockers
          ? "border-red-200 bg-red-50/30"
          : hasWarnings
          ? "border-orange-200 bg-orange-50/30"
          : "border-green-200 bg-green-50/30",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          Clôture de l'annee {summary.year.label}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verifiez l'etat de l'annee avant de la cloturer
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon={CheckCircle2} label="Eleves inscrits" value={summary.totalStudents} color="text-blue-600" />
          <StatBox icon={Calendar} label="Classes" value={summary.totalClasses} color="text-purple-600" />
          <StatBox icon={FileText} label="Bulletins non publies" value={summary.draftReportCards} color={summary.draftReportCards === 0 ? "text-green-600" : "text-orange-600"} />
          <StatBox icon={DollarSign} label="Factures impayees" value={summary.unpaidInvoices} color={summary.unpaidInvoices === 0 ? "text-green-600" : "text-red-600"} />
        </div>

        {/* BLOCAGES */}
        {hasBlockers && (
          <div className="rounded-lg border border-red-300 bg-red-100 p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-800 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {summary.blockers.length} blocage(s) empechent la cloture
            </div>
            <div className="space-y-1 text-sm text-red-700">
              {summary.blockers.map((b) => (
                <div key={b.type} className="flex items-center justify-between">
                  <span>{b.label}</span>
                  <span className="font-medium">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AVERTISSEMENTS */}
        {hasWarnings && !hasBlockers && (
          <div className="rounded-lg border border-orange-300 bg-orange-100 p-4 space-y-2">
            <div className="flex items-center gap-2 text-orange-800 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {summary.warnings.length} avertissement(s)
            </div>
            <div className="space-y-1 text-sm text-orange-700">
              {summary.warnings.map((w) => (
                <div key={w.type} className="flex items-center justify-between">
                  <span>{w.label}</span>
                  <span className="font-medium">{w.count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-600 italic">
              Ces avertissements n'empechent pas la clôture mais il est recommande de les traiter.
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {!hasBlockers && !hasWarnings && (
          <div className="rounded-lg border border-green-300 bg-green-100 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-700" />
            <div>
              <p className="font-medium text-green-800">Année prete a etre cloturee</p>
              <p className="text-xs text-green-700">Toutes les verifications sont passees.</p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">
              Voir le detail
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          {!hasBlockers && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (window.confirm(`Cloturer l'annee ${summary.year.label} ? Cette action empechera les modifications.`)) {
                  api
                    .post(`/academic-years/${summary.year.id}/close`)
                    .then(() => window.location.reload())
                    .catch((err) => alert(err?.response?.data?.message || "Erreur lors de la cloture"));
                }
              }}
            >
              <Lock className="h-4 w-4 mr-1" />
              Cloturer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="border rounded-lg p-3 bg-background">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
