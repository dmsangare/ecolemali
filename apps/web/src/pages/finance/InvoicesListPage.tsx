import { useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, Search, Loader2, Eye } from "lucide-react";
import { useInvoices } from "@/hooks/finance";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button, Input, Card, CardContent } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  UNPAID: "Non paye",
  PARTIAL: "Partiel",
  PAID: "Paye",
  OVERDUE: "En retard",
  CANCELLED: "Annule",
};

const STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-500/10 text-red-700",
  PARTIAL: "bg-orange-500/10 text-orange-700",
  PAID: "bg-green-500/10 text-green-700",
  OVERDUE: "bg-red-700/10 text-red-800",
  CANCELLED: "bg-gray-500/10 text-gray-700",
};

export function InvoicesListPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useInvoices({ page, limit: 20, q: q || undefined });
  const invoices = data?.data || [];
  const meta = data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Factures
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total || 0} facture(s)
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numero, eleve..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Aucune facture</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Numero</th>
                    <th className="px-4 py-3">Eleve</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Paye</th>
                    <th className="px-4 py-3 text-right">Solde</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-mono">{inv.number}</td>
                      <td className="px-4 py-3 text-sm">
                        {inv.student?.lastName} {inv.student?.firstName}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(inv.issuedAt)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                        {formatCurrency(inv.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                          {STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/invoices/${inv.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
