import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Search,
} from "lucide-react";
import { Input, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePendingInstallments } from "@/hooks/finance";
import { formatFCFA, INSTALLMENT_STATUS_LABELS } from "@/types/finance";
import type { InstallmentStatus } from "@/types/finance";

type FilterPeriod = "all" | "overdue" | "upcoming";

export function InstallmentsOverview() {
  const [period, setPeriod] = useState<FilterPeriod>("all");
  const [search, setSearch] = useState("");

  const { data: installments, isLoading } = usePendingInstallments();

  const now = new Date();

  // Filtrer par periode + recherche
  const filtered = useMemo(() => {
    if (!installments) return [];
    const q = search.trim().toLowerCase();

    return installments.filter((inst) => {
      // 1. Filtre par periode
      if (period === "overdue") {
        if (!inst.dueDate) return false;
        if (new Date(inst.dueDate) >= now) return false;
      } else if (period === "upcoming") {
        if (!inst.dueDate) return false;
        if (new Date(inst.dueDate) < now) return false;
      }
      // 2. Filtre par recherche
      if (q) {
        const haystack = [
          inst.invoice.student.firstName,
          inst.invoice.student.lastName,
          inst.invoice.student.matricule,
          inst.invoice.number,
          inst.label,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [installments, period, search, now]);

  // Stats
  const stats = useMemo(() => {
    if (!installments) return { total: 0, overdue: 0, upcoming: 0, totalDue: 0 };
    let overdue = 0;
    let upcoming = 0;
    let totalDue = 0;
    for (const inst of installments) {
      const remaining = Number(inst.amount) - Number(inst.paidAmount);
      totalDue += remaining;
      if (inst.dueDate) {
        if (new Date(inst.dueDate) < now) overdue++;
        else upcoming++;
      }
    }
    return {
      total: installments.length,
      overdue,
      upcoming,
      totalDue,
    };
  }, [installments, now]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      {/* Stats + Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          label="Total échéances"
          value={stats.total.toString()}
          icon={Calendar}
          color="text-blue-600"
        />
        <StatCard
          label="En retard"
          value={stats.overdue.toString()}
          icon={AlertTriangle}
          color="text-red-600"
        />
        <StatCard
          label="À venir"
          value={stats.upcoming.toString()}
          icon={Clock}
          color="text-yellow-600"
        />
        <StatCard
          label="Montant total dû"
          value={formatFCFA(stats.totalDue)}
          icon={CheckCircle2}
          color="text-orange-600"
        />
      </div>

      {/* Recherche + Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un élève, matricule, facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1 border rounded-md p-1">
          {(["all", "overdue", "upcoming"] as FilterPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {p === "all" ? "Toutes" : p === "overdue" ? "En retard" : "À venir"}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune échéance</p>
            <p className="text-xs mt-1">
              {search ? "Aucun résultat pour cette recherche" : "Aucune échéance en attente"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-medium">Élève</th>
                    <th className="text-left p-3 font-medium">Facture</th>
                    <th className="text-left p-3 font-medium">Échéance</th>
                    <th className="text-right p-3 font-medium">Reste dû</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Statut</th>
                    <th className="text-right p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((inst) => {
                    const remaining = Number(inst.amount) - Number(inst.paidAmount);
                    const dueDate = inst.dueDate ? new Date(inst.dueDate) : null;
                    const isOverdue = dueDate && dueDate < now;
                    const daysLate = isOverdue
                      ? Math.floor((now.getTime() - dueDate!.getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                    const statusInfo =
                      INSTALLMENT_STATUS_LABELS[inst.status as InstallmentStatus] ||
                      INSTALLMENT_STATUS_LABELS.PENDING;

                    return (
                      <tr key={inst.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <div className="font-medium">
                            {inst.invoice.student.lastName} {inst.invoice.student.firstName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {inst.invoice.student.matricule}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {inst.invoice.number}
                        </td>
                        <td className="p-3">{inst.label}</td>
                        <td className="p-3 text-right font-mono font-semibold text-orange-600">
                          {formatFCFA(remaining)}
                        </td>
                        <td className="p-3">
                          {dueDate ? (
                            <div>
                              <div className="text-xs">
                                {dueDate.toLocaleDateString("fr-FR")}
                              </div>
                              {isOverdue && (
                                <div className="text-xs text-red-600 font-medium">
                                  +{daysLate} j
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "text-[10px] uppercase font-semibold px-2 py-0.5 rounded",
                              statusInfo.color,
                              statusInfo.bg,
                            )}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            to={`/invoices/${inst.invoice.id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Voir
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 100 && (
                <div className="p-3 text-center text-xs text-muted-foreground border-t">
                  Affichage de 100 sur {filtered.length} échéances — affinez la recherche
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
      </CardContent>
    </Card>
  );
}
