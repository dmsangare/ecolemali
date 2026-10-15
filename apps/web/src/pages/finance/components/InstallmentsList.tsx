import { Calendar, CheckCircle2, Clock, AlertTriangle, Loader2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatFCFA, INSTALLMENT_STATUS_LABELS, type InvoiceInstallment } from "@/types/finance";

interface Props {
  installments: InvoiceInstallment[];
  onPayInstallment: (installment: InvoiceInstallment) => void;
  disabled?: boolean;
}

export function InstallmentsList({ installments, onPayInstallment, disabled }: Props) {
  if (installments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Aucune échéance pour cette facture
        </CardContent>
      </Card>
    );
  }

  const totalDue = installments.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = installments.reduce((s, i) => s + Number(i.paidAmount), 0);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Échéancier</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatFCFA(totalPaid)} / {formatFCFA(totalDue)}
          </span>
        </div>

        <div className="divide-y">
          {installments.map((inst) => {
            const amount = Number(inst.amount);
            const paid = Number(inst.paidAmount);
            const remaining = Math.max(amount - paid, 0);
            const pct = amount > 0 ? Math.min((paid / amount) * 100, 100) : 0;
            const statusInfo = INSTALLMENT_STATUS_LABELS[inst.status];
            const Icon =
              inst.status === "PAID"
                ? CheckCircle2
                : inst.status === "OVERDUE"
                ? AlertTriangle
                : Clock;
            const canPay = inst.status !== "PAID" && remaining > 0;

            const barColor =
              inst.status === "PAID"
                ? "bg-green-500"
                : inst.status === "OVERDUE"
                ? "bg-red-500"
                : inst.status === "PARTIAL"
                ? "bg-yellow-500"
                : "bg-gray-300";

            return (
              <div key={inst.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={cn("h-4 w-4 shrink-0", statusInfo.color)} />
                    <span className="font-medium truncate">{inst.label}</span>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded",
                        statusInfo.color,
                        statusInfo.bg,
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="text-sm font-mono shrink-0">
                    {formatFCFA(amount)}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full transition-all", barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Payé : <span className="font-mono text-foreground">{formatFCFA(paid)}</span>
                    {remaining > 0 && (
                      <>
                        {" · "}
                        Reste : <span className="font-mono text-orange-600">{formatFCFA(remaining)}</span>
                      </>
                    )}
                  </span>
                  {inst.dueDate && (
                    <span className="text-muted-foreground">
                      Éch. {new Date(inst.dueDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>

                {canPay && (
                  <button
                    type="button"
                    onClick={() => onPayInstallment(inst)}
                    disabled={disabled}
                    className={cn(
                      "w-full mt-1 flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Encaisser cette échéance
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
