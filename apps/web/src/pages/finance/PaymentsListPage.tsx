import { useState } from "react";
import { Wallet, Loader2, TrendingUp } from "lucide-react";
import { usePayments } from "@/hooks/finance";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Especes",
  TRANSFER: "Virement",
  CHECK: "Cheque",
  MOBILE_MONEY: "Mobile Money",
  OTHER: "Autre",
};

export function PaymentsListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayments({ page, limit: 20 });
  const payments = data?.data || [];
  const meta = data?.meta;

  const total = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Paiements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total || 0} paiement(s)
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500/10 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total (page courante)</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Aucun paiement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Recu</th>
                    <th className="px-4 py-3">Eleve</th>
                    <th className="px-4 py-3">Facture</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Methode</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-mono">
                        {p.receipt?.number || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {p.student?.lastName} {p.student?.firstName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {p.invoice?.number || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDateTime(p.paidAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        {METHOD_LABELS[p.method] || p.method}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(p.amount)}
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
