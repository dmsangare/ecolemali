import { useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { useCashSessions } from "@/hooks/finance";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouverte",
  CLOSED: "Fermee",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-500/10 text-green-700",
  CLOSED: "bg-gray-500/10 text-gray-700",
};

export function CashSessionsListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCashSessions({ page, limit: 20 });
  const sessions = data?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Sessions de caisse
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historique des ouvertures et fermetures de caisse
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Aucune session de caisse</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Ouverture</th>
                    <th className="px-4 py-3">Fermeture</th>
                    <th className="px-4 py-3 text-right">Montant initial</th>
                    <th className="px-4 py-3 text-right">Theorique</th>
                    <th className="px-4 py-3 text-right">Reel</th>
                    <th className="px-4 py-3 text-right">Ecart</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">{formatDateTime(s.openedAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        {s.closedAt ? formatDateTime(s.closedAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(s.openingAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {s.expectedAmount ? formatCurrency(s.expectedAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {s.closingAmount ? formatCurrency(s.closingAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {s.difference !== null && s.difference !== undefined ? (
                          <span className={s.difference < 0 ? "text-red-600" : s.difference > 0 ? "text-orange-600" : "text-green-600"}>
                            {formatCurrency(s.difference)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                          {STATUS_LABELS[s.status]}
                        </span>
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
