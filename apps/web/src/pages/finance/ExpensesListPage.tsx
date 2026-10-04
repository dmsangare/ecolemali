import { useState, useMemo } from "react";
import {
  Receipt,
  Search,
  Loader2,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
  Filter,
} from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/hooks/finance";
import { formatFCFA } from "@/types/finance";
import type { Expense } from "@/types/finance";

export function ExpensesListPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filters: any = { limit: 100 };
  if (search) filters.q = search;
  if (categoryFilter) filters.categoryId = categoryFilter;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const { data, isLoading } = useExpenses(filters);

  const expenses = useMemo<Expense[]>(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any).items || [];
  }, [data]);

  const totalAmount = (data as any)?.totalAmount || 0;
  const totalCount = (data as any)?.total || expenses.length;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            Depenses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} depense(s) · {formatFCFA(totalAmount)} au total
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle depense
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total depense"
          value={formatFCFA(totalAmount)}
          icon={<Wallet className="h-4 w-4" />}
          color="text-red-600"
        />
        <StatCard
          label="Nb depenses"
          value={String(totalCount)}
          icon={<Receipt className="h-4 w-4" />}
          color="text-blue-600"
        />
        <StatCard
          label="Depense moyenne"
          value={formatFCFA(totalCount > 0 ? Math.round(totalAmount / totalCount) : 0)}
          icon={<TrendingDown className="h-4 w-4" />}
          color="text-orange-600"
        />
        <StatCard
          label="Ce mois"
          value={formatFCFA(
            expenses
              .filter((e) => {
                const d = new Date(e.spentAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              })
              .reduce((sum, e) => sum + Number(e.amount), 0),
          )}
          icon={<Calendar className="h-4 w-4" />}
          color="text-purple-600"
        />
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Description, beneficiaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="Du"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="Au"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtres actifs : {[search, dateFrom, dateTo, categoryFilter].filter(Boolean).length}
        </div>
      </div>

      {/* CONTENU */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <TrendingDown className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucune depense enregistree</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Nouvelle depense" pour commencer
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
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Categorie</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-left p-3 font-medium">Beneficiaire</th>
                    <th className="text-left p-3 font-medium">Caissier</th>
                    <th className="text-right p-3 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(exp.spentAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3">
                        {exp.category ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-muted">
                            <span>{exp.category.emoji || "📦"}</span>
                            {exp.category.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 max-w-md">
                        <div className="font-medium truncate">
                          {exp.description}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {exp.beneficiary || "—"}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {exp.cashier
                          ? `${exp.cashier.firstName} ${exp.cashier.lastName}`
                          : "—"}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-red-600">
                        -{formatFCFA(Number(exp.amount))}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-bold">
                    <td colSpan={5} className="p-3 text-right">
                      TOTAL
                    </td>
                    <td className="p-3 text-right font-mono text-base text-red-600">
                      -{formatFCFA(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
