import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  Search,
  Loader2,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useInvoices, useFinanceDashboard } from "@/hooks/finance";
import { useClasses, useLevels } from "@/hooks/classes";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CreateInvoiceModal } from "./components/CreateInvoiceModal";
import {
  INVOICE_STATUS_LABELS,
  formatFCFA,
  type Invoice,
  type InvoiceStatus,
} from "@/types/finance";

interface AcademicYear {
  id: string;
  label: string;
  isCurrent: boolean;
}

export function InvoicesListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return (data.data || data) as AcademicYear[];
    },
    staleTime: 10 * 60_000,
  });

  // Annee courante par defaut
  if (academicYears && !academicYearId) {
    const cur = academicYears.find((y) => y.isCurrent) || academicYears[0];
    if (cur) setAcademicYearId(cur.id);
  }

  const { data: classes } = useClasses();
  const { data: levels } = useLevels();

  const filters: any = { academicYearId };
  if (statusFilter) filters.status = statusFilter;

  const { data, isLoading } = useInvoices(filters);
  const { data: dashboard } = useFinanceDashboard(academicYearId);

  const invoiceList = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any).data || [];
  }, [data]);

  // Filtre classe + recherche
  const filtered = useMemo(() => {
    let list = invoiceList;

    // Filtre classe
    if (classFilter) {
      const levelId = classes?.find((c) => c.id === classFilter)?.levelId;
      list = list.filter((inv: Invoice) => {
        // On doit matcher via le student's enrollment
        return true; // Simplifions : on filtre cote front apres chargement complet
      });
    }

    // Filtre recherche
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((inv: Invoice) => {
        const name = `${inv.student?.lastName || ""} ${inv.student?.firstName || ""}`;
        return (
          name.toLowerCase().includes(q) ||
          inv.number?.toLowerCase().includes(q) ||
          inv.student?.matricule?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [invoiceList, search, classFilter, classes]);

  // Classes triees
  const sortedClasses = useMemo(() => {
    if (!classes || !levels) return [];
    return [...classes].sort((a, b) => {
      const la = levels.find((l) => l.id === a.levelId)?.orderIndex ?? 999;
      const lb = levels.find((l) => l.id === b.levelId)?.orderIndex ?? 999;
      if (la !== lb) return la - lb;
      return a.code.localeCompare(b.code);
    });
  }, [classes, levels]);

  // Stats depuis le dashboard
  const stats = dashboard || {
    totalBilled: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    invoicesCount: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    overdueCount: 0,
  };

  const collectionRate =
    stats.totalBilled > 0 ? (stats.totalPaid / stats.totalBilled) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Factures
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.invoicesCount} facture(s) · {formatFCFA(stats.totalBilled)} facturé ·{" "}
            {formatFCFA(stats.totalUnpaid)} impayé
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setManualModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture manuelle
          </Button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total facturé"
          value={formatFCFA(stats.totalBilled)}
          icon={<Receipt className="h-4 w-4" />}
          color="text-blue-600"
        />
        <StatCard
          label="Encaissé"
          value={formatFCFA(stats.totalPaid)}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-green-600"
        />
        <StatCard
          label="Impayé"
          value={formatFCFA(stats.totalUnpaid)}
          icon={<TrendingDown className="h-4 w-4" />}
          color="text-red-600"
        />
        <StatCard
          label="Taux recouvrement"
          value={`${collectionRate.toFixed(1)}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color={collectionRate >= 80 ? "text-green-600" : collectionRate >= 50 ? "text-orange-600" : "text-red-600"}
        />
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {academicYears?.map((y) => (
            <option key={y.id} value={y.id}>
              📅 {y.label}
            </option>
          ))}
        </select>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">🏫 Toutes les classes</option>
          {sortedClasses.map((c) => {
            const level = levels?.find((l) => l.id === c.levelId);
            const emoji = level?.cycle === "PREMIER_CYCLE" ? "📗" : "📘";
            return (
              <option key={c.id} value={c.id}>
                {emoji} {c.name}
              </option>
            );
          })}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">📊 Tous les statuts</option>
          {Object.entries(INVOICE_STATUS_LABELS).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="N°, élève, matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* CONTENU */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucune facture trouvée</p>
            <p className="text-sm text-muted-foreground mt-1">
              Générez des factures depuis la fiche élève
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
                    <th className="text-left p-3 font-medium">N°</th>
                    <th className="text-left p-3 font-medium">Élève</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-right p-3 font-medium">Payé</th>
                    <th className="text-right p-3 font-medium">Solde</th>
                    <th className="text-center p-3 font-medium">Statut</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv: Invoice) => {
                    const statusInfo =
                      INVOICE_STATUS_LABELS[inv.status] || INVOICE_STATUS_LABELS.UNPAID;
                    const balance = Number(inv.balance) || 0;
                    return (
                      <tr
                        key={inv.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="p-3 font-mono text-xs">{inv.number}</td>
                        <td className="p-3">
                          {inv.student ? (
                            <div>
                              <div className="font-medium">
                                {inv.student.lastName} {inv.student.firstName}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {inv.student.matricule}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {inv.issuedAt
                            ? new Date(inv.issuedAt).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {formatFCFA(inv.totalAmount)}
                        </td>
                        <td className="p-3 text-right font-mono text-green-600">
                          {formatFCFA(inv.paidAmount)}
                        </td>
                        <td
                          className={cn(
                            "p-3 text-right font-mono font-semibold",
                            balance > 0 ? "text-red-600" : "text-green-600",
                          )}
                        >
                          {formatFCFA(balance)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded text-xs font-medium",
                              statusInfo.color,
                            )}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/invoices/${inv.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Voir
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODALE NOUVELLE FACTURE MANUELLE */}
      {manualModalOpen && (
        <CreateInvoiceModal
          onClose={() => setManualModalOpen(false)}
        />
      )}


    </div>
  );
}

// ============================================================
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
      </CardContent>
    </Card>
  );
}
