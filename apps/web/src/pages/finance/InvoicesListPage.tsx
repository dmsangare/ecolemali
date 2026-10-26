import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  Eye,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  Button,
  Input,
  PageLoader,
  EmptyState,
  KpiCard,
  StatusBadge,
} from "@/components/ui";
import { DataTable, Column } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useInvoices, useFinanceDashboard } from "@/hooks/finance";
import { useClasses, useLevels } from "@/hooks/classes";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CreateInvoiceModal } from "./components/CreateInvoiceModal";
import { BulkInvoiceModal } from "./components/BulkInvoiceModal";
import {
  INVOICE_STATUS_LABELS,
  formatFCFA,
  type Invoice,
} from "@/types/finance";

interface AcademicYear {
  id: string;
  label: string;
  isCurrent: boolean;
}

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "PAID":
      return "success";
    case "PARTIAL":
      return "warning";
    case "UNPAID":
      return "danger";
    case "OVERDUE":
      return "danger";
    case "CANCELLED":
      return "neutral";
    default:
      return "neutral";
  }
}

export function InvoicesListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return (data.data || data) as AcademicYear[];
    },
    staleTime: 10 * 60_000,
  });

  // Année courante par défaut (dans useEffect, pas pendant le rendu)
  useEffect(() => {
    if (academicYears && academicYears.length > 0 && !academicYearId) {
      const cur = academicYears.find((y) => y.isCurrent) || academicYears[0];
      if (cur) setAcademicYearId(cur.id);
    }
  }, [academicYears, academicYearId]);

  const { data: classes } = useClasses();
  const { data: levels } = useLevels();

  const filters: Record<string, string> = { academicYearId };
  if (statusFilter) filters.status = statusFilter;

  const { data, isLoading } = useInvoices(filters);
  const { data: dashboard } = useFinanceDashboard(academicYearId);

  const invoiceList: Invoice[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any).data || [];
  }, [data]);

  const filtered = useMemo(() => {
    let list = invoiceList;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((inv) => {
        const name = `${inv.student?.lastName || ""} ${inv.student?.firstName || ""}`;
        return (
          name.toLowerCase().includes(q) ||
          inv.number?.toLowerCase().includes(q) ||
          inv.student?.matricule?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [invoiceList, search]);

  const sortedClasses = useMemo(() => {
    if (!classes || !levels) return [];
    return [...classes].sort((a, b) => {
      const la = levels.find((l) => l.id === a.levelId)?.orderIndex ?? 999;
      const lb = levels.find((l) => l.id === b.levelId)?.orderIndex ?? 999;
      if (la !== lb) return la - lb;
      return a.code.localeCompare(b.code);
    });
  }, [classes, levels]);

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

  const hasFilters = Boolean(search || statusFilter || classFilter);

  const handleReset = () => {
    setSearch("");
    setStatusFilter("");
    setClassFilter("");
  };

  // ============================================================
  // Colonnes du tableau
  // ============================================================
  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: "N°",
      cell: (inv) => (
        <span className="font-mono text-xs">{inv.number}</span>
      ),
    },
    {
      key: "student",
      header: "Élève",
      cell: (inv) =>
        inv.student ? (
          <div>
            <div className="font-medium">
              {inv.student.lastName} {inv.student.firstName}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {inv.student.matricule}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "date",
      header: "Date",
      cell: (inv) => (
        <span className="text-muted-foreground text-xs">
          {inv.issuedAt
            ? new Date(inv.issuedAt).toLocaleDateString("fr-FR")
            : "—"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      headerClassName: "text-right",
      className: "text-right",
      cell: (inv) => (
        <span className="font-mono">{formatFCFA(inv.totalAmount)}</span>
      ),
    },
    {
      key: "paid",
      header: "Payé",
      headerClassName: "text-right",
      className: "text-right",
      cell: (inv) => (
        <span className="font-mono text-sis-success">
          {formatFCFA(inv.paidAmount)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Solde",
      headerClassName: "text-right",
      className: "text-right",
      cell: (inv) => {
        const balance = Number(inv.balance) || 0;
        return (
          <span
            className={cn(
              "font-mono font-semibold",
              balance > 0 ? "text-sis-danger" : "text-sis-success",
            )}
          >
            {formatFCFA(balance)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      headerClassName: "text-center",
      className: "text-center",
      cell: (inv) => {
        const info =
          INVOICE_STATUS_LABELS[inv.status] || INVOICE_STATUS_LABELS.UNPAID;
        return (
          <StatusBadge
            variant={getStatusVariant(inv.status)}
            showIcon={false}
          >
            {info.label}
          </StatusBadge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (inv) => (
        <Button asChild variant="ghost" size="sm">
          <Link to={`/invoices/${inv.id}`}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Voir
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sis-md bg-sis-brand-50 text-sis-brand mt-0.5 dark:bg-sis-brand-900/30 dark:text-sis-brand-300">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.invoicesCount} facture(s) · {formatFCFA(stats.totalBilled)} facturé ·{" "}
              {formatFCFA(stats.totalUnpaid)} impayé
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/invoices/import-situation">
              <Upload className="h-4 w-4 mr-2" />
              Importer une situation
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setBulkModalOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Facturer en masse
          </Button>
          <Button onClick={() => setManualModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture manuelle
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total facturé"
          value={formatFCFA(stats.totalBilled)}
          hint="Année sélectionnée"
          icon={<Receipt className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Encaissé"
          value={formatFCFA(stats.totalPaid)}
          hint={`${stats.paidCount} facture(s) payée(s)`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="success"
        />
        <KpiCard
          label="Impayé"
          value={formatFCFA(stats.totalUnpaid)}
          hint={`${stats.unpaidCount} facture(s) en attente`}
          icon={<TrendingDown className="h-5 w-5" />}
          accent="danger"
        />
        <KpiCard
          label="Taux recouvrement"
          value={`${collectionRate.toFixed(1)}%`}
          hint={
            collectionRate >= 80
              ? "Excellent"
              : collectionRate >= 50
                ? "En progression"
                : "À améliorer"
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent={
            collectionRate >= 80
              ? "success"
              : collectionRate >= 50
                ? "warning"
                : "danger"
          }
        />
      </div>

      {/* FILTRES */}
      <div className="rounded-sis-lg border border-sis-neutral-200 bg-card p-4 dark:border-sis-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="h-10 rounded-sis-md border border-sis-neutral-200 bg-card px-3 text-sm transition-colors hover:border-sis-neutral-300 focus:outline-none focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700 dark:bg-sis-neutral-900"
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
            className="h-10 rounded-sis-md border border-sis-neutral-200 bg-card px-3 text-sm transition-colors hover:border-sis-neutral-300 focus:outline-none focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700 dark:bg-sis-neutral-900"
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
            className="h-10 rounded-sis-md border border-sis-neutral-200 bg-card px-3 text-sm transition-colors hover:border-sis-neutral-300 focus:outline-none focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700 dark:bg-sis-neutral-900"
          >
            <option value="">📊 Tous les statuts</option>
            {Object.entries(INVOICE_STATUS_LABELS).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>

          <Input
            placeholder="N°, élève, matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
          />
        </div>

        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      {/* TABLEAU OU ÉTAT */}
      {isLoading ? (
        <PageLoader label="Chargement des factures..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-7 w-7" />}
          title="Aucune facture trouvée"
          description={
            hasFilters
              ? "Essayez de modifier les filtres de recherche."
              : "Générez des factures depuis la fiche élève."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={handleReset}>
                Réinitialiser les filtres
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(inv) => inv.id}
        />
      )}

      {/* MODALES */}
      {manualModalOpen && (
        <CreateInvoiceModal onClose={() => setManualModalOpen(false)} />
      )}
      {bulkModalOpen && (
        <BulkInvoiceModal onClose={() => setBulkModalOpen(false)} />
      )}
    </div>
  );
}