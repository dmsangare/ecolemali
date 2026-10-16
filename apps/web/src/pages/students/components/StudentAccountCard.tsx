import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Minus, DollarSign, Loader2 } from "lucide-react";
import {
  Card, CardContent, Button, Input, Label,
} from "@/components/ui";
import { formatFCFA } from "@/types/finance";
import { useStudentAccount, useRefundCredit } from "@/hooks/studentAccounts";
import { cn } from "@/lib/utils";

interface Props {
  studentId: string;
}

export function StudentAccountCard({ studentId }: Props) {
  const { data: account, isLoading } = useStudentAccount(studentId);
  const refund = useRefundCredit(studentId);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!account) return null;

  const credit = Number(account.creditBalance);
  const debt = Number(account.debtBalance);
  const balance = credit - debt;

  const handleRefund = async () => {
    const amt = Number(refundAmount.replace(/\s/g, ""));
    if (!amt || amt <= 0) return;
    await refund.mutateAsync({ amount: amt, note: refundNote || undefined });
    setRefundOpen(false);
    setRefundAmount("");
    setRefundNote("");
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Compte élève</h3>
            <p className="text-xs text-muted-foreground">
              Solde net de l'élève (crédit/dette)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Credit */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              Crédit
            </div>
            <p className={cn("font-mono font-semibold text-lg", credit > 0 ? "text-green-700" : "text-muted-foreground")}>
              {formatFCFA(credit)}
            </p>
          </div>

          {/* Dette */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              Dette
            </div>
            <p className={cn("font-mono font-semibold text-lg", debt > 0 ? "text-red-700" : "text-muted-foreground")}>
              {formatFCFA(debt)}
            </p>
          </div>

          {/* Solde net */}
          <div className={cn("rounded-lg border-2 p-3", balance >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50")}>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              {balance > 0 ? <TrendingUp className="h-3 w-3" /> : balance < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              Solde net
            </div>
            <p className={cn("font-mono font-bold text-lg", balance > 0 ? "text-green-700" : balance < 0 ? "text-red-700" : "text-muted-foreground")}>
              {formatFCFA(Math.abs(balance))}
              {balance < 0 && " (dû)"}
            </p>
          </div>
        </div>

        {/* Action : rembourser le crédit */}
        {credit > 0 && !refundOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefundOpen(true);
              setRefundAmount(String(credit));
            }}
            className="w-full"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Rembourser le crédit au parent
          </Button>
        )}

        {/* Formulaire de remboursement */}
        {refundOpen && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <Label className="text-xs">Montant à rembourser (max {formatFCFA(credit)})</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="font-mono mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Motif (optionnel)</Label>
              <Input
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                placeholder="Remboursement au parent"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRefundOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleRefund}
                disabled={refund.isPending || !refundAmount}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {refund.isPending ? "En cours..." : "Confirmer le remboursement"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
