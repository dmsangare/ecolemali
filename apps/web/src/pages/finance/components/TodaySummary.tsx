import { TrendingUp, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodayTotal } from "@/hooks/finance";
import { formatFCFA } from "@/types/finance";

export function TodaySummary() {
  const { data, isLoading } = useTodayTotal();

  const count = data?.count ?? 0;
  const total = data?.total ?? 0;

  return (
    <div className="border-t bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Aujourd'hui</span>
            <span
              className={cn(
                "font-mono font-semibold text-lg",
                total > 0 ? "text-green-600" : "text-muted-foreground",
              )}
            >
              {isLoading ? "…" : formatFCFA(total)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Receipt className="h-3 w-3" />
            {isLoading
              ? "Chargement…"
              : `${count} paiement${count > 1 ? "s" : ""} enregistré${
                  count > 1 ? "s" : ""
                }`}
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground hidden sm:block">
        {count === 0
          ? "Aucun encaissement pour le moment"
          : `Moyenne : ${formatFCFA(Math.round(total / count))}`}
      </div>
    </div>
  );
}
