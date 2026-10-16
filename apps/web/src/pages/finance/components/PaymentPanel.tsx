import { useMemo, useState } from "react";
import {
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useCreatePayment } from "@/hooks/finance";
import {
  formatFCFA,
  PAYMENT_METHOD_LABELS,
  type Invoice,
  type InvoiceInstallment,
  type PaymentMethod,
} from "@/types/finance";

interface Props {
  invoice: Invoice;
  studentId: string;
  installment: InvoiceInstallment | null;
  onPaymentSuccess: () => void;
  onClearInstallment?: () => void;
}

function generateIdempotencyKey(prefix = "pay"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

export function PaymentPanel({
  invoice,
  studentId,
  installment,
  onPaymentSuccess,
  onClearInstallment,
}: Props) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createMutation = useCreatePayment();

  // Cle d'idempotence : change a chaque nouvelle facture/echeance
  const idempotencyKey = useMemo(
    () => generateIdempotencyKey(installment ? "inst" : "inv"),
    [invoice.id, installment?.id],
  );

  // Calcul des montants disponibles
  const invoiceBalance = Number(invoice.balance || 0);
  const installmentDue = installment
    ? Math.max(Number(installment.amount) - Number(installment.paidAmount), 0)
    : 0;

  const isPaid = invoice.status === "PAID";

  // Suggestions
  const suggestions = useMemo(() => {
    const list: Array<{ label: string; value: number; hint?: string }> = [];
    if (installment && installmentDue > 0) {
      list.push({
        label: "Échéance due",
        value: installmentDue,
        hint: installment.label,
      });
    }
    if (invoiceBalance > 0 && invoiceBalance !== installmentDue) {
      list.push({
        label: "Solde total",
        value: invoiceBalance,
        hint: `Facture ${invoice.number}`,
      });
    }
    return list;
  }, [installment, installmentDue, invoiceBalance, invoice.number]);

  const handleAmountChange = (raw: string) => {
    setAmount(raw.replace(/[^\d]/g, ""));
  };

  const amountNum = Number(amount) || 0;
  const isOverBalance = amountNum > invoiceBalance + 0.001;
  const needsReference = method !== "CASH";
  const isValid =
    amountNum > 0 && !isOverBalance && (!needsReference || reference.trim().length >= 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await createMutation.mutateAsync({
        invoiceId: invoice.id,
        studentId,
        amount: amountNum,
        method,
        reference: needsReference ? reference.trim() : undefined,
        installmentId: installment?.id,
      });

      setSuccessMessage(
        `Encaissé ${formatFCFA(amountNum)} avec succès`,
      );
      setAmount("");
      setReference("");
      onPaymentSuccess();

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      // Erreur gérée par le hook
    }
  };

  // --- État "facture déjà payée" ---
  if (isPaid) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
          <p className="font-medium">Facture déjà soldée</p>
          <p className="text-xs text-muted-foreground mt-1">
            {invoice.number} · {formatFCFA(invoiceBalance)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="font-semibold">Encaissement</span>
        </div>

        {/* Contexte */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Facture</span>
            <span className="font-mono">{invoice.number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reste à payer</span>
            <span className="font-mono font-semibold text-orange-600">
              {formatFCFA(invoiceBalance)}
            </span>
          </div>
          {installment && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Échéance ciblée</span>
              <span className="font-medium truncate max-w-[150px] text-right">
                {installment.label}
              </span>
            </div>
          )}
        </div>

        {/* Message succes */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Montant */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant à encaisser</label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                autoFocus
                disabled={createMutation.isPending}
                className="text-right font-mono text-lg"
              />
              <span className="text-sm font-medium text-muted-foreground">
                FCFA
              </span>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setAmount(String(s.value))}
                    disabled={createMutation.isPending}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-md border font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "disabled:opacity-50",
                    )}
                  >
                    {s.label}
                    <span className="ml-1 text-muted-foreground font-mono">
                      {formatFCFA(s.value)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isOverBalance && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                Le montant dépasse le solde restant
              </div>
            )}
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-2">
              {(["CASH", "MOBILE_MONEY"] as PaymentMethod[]).map((m) => {
                const info = PAYMENT_METHOD_LABELS[m];
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    disabled={createMutation.isPending}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-accent",
                      "disabled:opacity-50",
                    )}
                  >
                    <span>{info.emoji}</span>
                    {info.label}
                  </button>
                );
              })}
            </div>

            {/* Autres modes (petits) */}
            <div className="flex flex-wrap gap-1 pt-1">
              {(["TRANSFER", "CHECK", "OTHER"] as PaymentMethod[]).map((m) => {
                const info = PAYMENT_METHOD_LABELS[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    disabled={createMutation.isPending}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded border transition-colors",
                      method === m
                        ? "border-primary bg-primary/5 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {info.emoji} {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference (obligatoire si != CASH) */}
          {needsReference && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Référence transaction <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: OM-12345678"
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 3 caractères
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              disabled={!isValid || createMutation.isPending}
              className="w-full"
              size="lg"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Encaissement…
                </>
              ) : (
                <>
                  Encaisser
                  {amountNum > 0 && (
                    <span className="ml-2 font-mono">
                      {formatFCFA(amountNum)}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {installment && onClearInstallment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearInstallment}
                disabled={createMutation.isPending}
                className="w-full text-xs text-muted-foreground"
              >
                Encaisser hors échéance (FIFO automatique)
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
