import { useState, useMemo } from "react";
import {
  Receipt,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
  RotateCcw,
} from "lucide-react";
import {
  Button,
  Input,
  PageLoader,
  EmptyState,
  KpiCard,
} from "@/components/ui";
import { DataTable, Column } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/hooks/finance";
import { formatFCFA } from "@/types/finance";
import type { Expense } from "@/types/finance";
import { CreateExpenseModal } from "./components/CreateExpenseModal";

export function ExpensesListPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filters: Record<string, any> = { limit: 100 };
  if (search) filters.q = search;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const { data, isLoading } = useExpenses(filters);

  const expenses = useMemo<Expense[]>(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any).items || [];
  }, [data]);

  const totalAmount = (data as any)?.totalAmount || 0;
  const totalCount = (data as any)?.total || expenses.length;

  const thisMonthAmount = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.spentAt);
        const now = new Date();
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const averageAmount =
    totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

  const hasFilters = Boolean(search || dateFrom || dateTo);

  const handleReset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  // ============================================================
  // Colonnes du tableau
  // ============================================================
  const columns: Column<Expense>[] = [
    {
      key: "date",
      header: "Date",
      cell: (exp) => (
        <span className="text-muted-foreground text-xs">
          {new Date(exp.spentAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "category",
      header: "Catégorie",
      cell: (exp) =>
        exp.category ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-sis-neutral-100 text-sis-neutral-700 dark:bg-sis-neutral-800 dark:text-sis-neutral-300">
            <span>{exp.category.emoji || "📦"}</span>
            {exp.category.name}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "description",
      header: "Description",
      cell: (exp) => (
        <div className="font-medium truncate max-w-md">{exp.description}</div>
      ),
    },
    {
      key: "beneficiary",
      header: "Bénéficiaire",
      cell: (exp) => (
        <span className="text-muted-foreground">
          {exp.beneficiary || "—"}
        </span>
      ),
    },
    {
      key: "cashier",
      header: "Caissier",
      cell: (exp) => (
        <span className="text-xs text-muted-foreground">
          {exp.cashier
            ? `${exp.cashier.firstName} ${exp.cashier.lastName}`
            : "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      headerClassName: "text-right",
      className: "text-right",
      cell: (exp) => (
        <span className="font-mono font-semibold text-sis-danger">
          -{formatFCFA(Number(exp.amount))}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sis-md bg-sis-danger-bg text-sis-danger mt-0.5 dark:bg-sis-danger-bg/30">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dépenses</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount} dépense(s) · {formatFCFA(totalAmount)} au total
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle dépense
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total dépensé"
          value={formatFCFA(totalAmount)}
          hint="Sur la période sélectionnée"
          icon={<Wallet className="h-5 w-5" />}
          accent="danger"
        />
        <KpiCard
          label="Nombre de dépenses"
          value={String(totalCount)}
          hint="Transactions enregistrées"
          icon={<Receipt className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Dépense moyenne"
          value={formatFCFA(averageAmount)}
          hint="Par transaction"
          icon={<TrendingDown className="h-5 w-5" />}
          accent="warning"
        />
        <KpiCard
          label="Ce mois"
          value={formatFCFA(thisMonthAmount)}
          hint="Dépenses du mois en cours"
          icon={<Calendar className="h-5 w-5" />}
          accent="info"
        />
      </div>

      {/* FILTRES */}
      <div className="rounded-sis-lg border border-sis-neutral-200 bg-card p-4 dark:border-sis-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Description, bénéficiaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
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
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      {/* TABLEAU OU ÉTAT */}
      {isLoading ? (
        <PageLoader label="Chargement des dépenses..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<TrendingDown className="h-7 w-7" />}
          title="Aucune dépense enregistrée"
          description={
            hasFilters
              ? "Essayez de modifier les filtres de recherche."
              : "Cliquez sur « Nouvelle dépense » pour commencer."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={handleReset}>
                Réinitialiser les filtres
              </Button>
            ) : (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle dépense
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          data={expenses}
          columns={columns}
          keyExtractor={(exp) => exp.id}
          rowClassName={() => "last:border-0"}
        />
      )}

      {/* MODALE */}
      {modalOpen && (
        <CreateExpenseModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}