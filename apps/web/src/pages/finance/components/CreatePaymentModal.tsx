import { useState, useMemo, useEffect } from "react";
import { X, Loader2, Wallet, AlertCircle } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useCreatePayment, useInvoices } from "@/hooks/finance";
import {
  PAYMENT_METHOD_LABELS,
  formatFCFA,
  type PaymentMethod,
  type Invoice,
} from "@/types/finance";

interface Props {
  onClose: () => void;
  preselectedInvoiceId?: string;
}

const METHODS: PaymentMethod[] = ["CASH", "MOBILE_MONEY", "TRANSFER", "CHECK", "OTHER"];

export function CreatePaymentModal({ onClose, preselectedInvoiceId }: Props) {
  const [invoiceId, setInvoiceId] = useState(preselectedInvoiceId || "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");

  const createMutation = useCreatePayment();

  // Charger les factures impayees/partielles
  const { data: invoicesData } = useInvoices({ limit: 200 });

  const invoices = useMemo<Invoice[]>(() => {
    if (!invoicesData) return [];
    const list = Array.isArray(invoicesData)
      ? invoicesData
      : (invoicesData as any).data || [];
    return list.filter(
      (inv: Invoice) =>
        Number(inv.balance) > 0 && inv.status !== "CANCELLED",
    );
  }, [invoicesData]);

  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);
  const balance = selectedInvoice ? Number(selectedInvoice.balance) : 0;

  // Reset montant quand on change de facture
  useEffect(() => {
    setAmount("");
  }, [invoiceId]);

  const amountNum = parseFloat(amount) || 0;
  const isOverBalance = amountNum > balance;
  const isValid = invoiceId && amountNum > 0 && !isOverBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !selectedInvoice) return;

    const input: any = {
      invoiceId: selectedInvoice.id,
      studentId: selectedInvoice.studentId,
      amount: amountNum,
      method,
    };
    if (reference.trim()) input.reference = reference.trim();

    try {
      await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // erreur geree par le hook
    }
  };

  const needsReference = method === "MOBILE_MONEY" || method === "TRANSFER" || method === "CHECK";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Nouveau paiement</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Enregistrer un encaissement
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* CORPS */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* FACTURE */}
            <div>
              <Label>Facture concernée</Label>
              <select
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
                disabled={!!preselectedInvoiceId}
              >
                <option value="">-- Sélectionner une facture --</option>
                {invoices.map((inv) => {
                  const name = inv.student
                    ? `${inv.student.lastName} ${inv.student.firstName}`
                    : "—";
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.number} — {name} — Solde {formatFCFA(inv.balance)}
                    </option>
                  );
                })}
              </select>

              {invoices.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aucune facture avec solde impayé
                </p>
              )}
            </div>

            {/* RECAP FACTURE */}
            {selectedInvoice && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Détail facture
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total :</span>
                    <span className="font-mono">
                      {formatFCFA(selectedInvoice.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Déjà payé :</span>
                    <span className="font-mono text-green-600">
                      {formatFCFA(selectedInvoice.paidAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between col-span-2 border-t pt-2">
                    <span className="text-muted-foreground font-medium">
                      Solde actuel :
                    </span>
                    <span className="font-mono font-bold text-red-600">
                      {formatFCFA(selectedInvoice.balance)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MONTANT */}
            <div>
              <Label htmlFor="amount">Montant à payer (FCFA)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="Ex: 100000"
                className={cn(
                  "mt-1 font-mono text-lg font-bold",
                  isOverBalance && "border-destructive",
                )}
                disabled={!invoiceId}
                required
              />
              {amountNum > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFCFA(amountNum)}
                </p>
              )}
              {isOverBalance && (
                <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Le montant dépasse le solde ({formatFCFA(balance)})
                </div>
              )}
              {selectedInvoice && balance > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(balance))}
                  >
                    Payer tout ({formatFCFA(balance)})
                  </Button>
                </div>
              )}
            </div>

            {/* METHODE */}
            <div>
              <Label className="mb-2 block">Méthode de paiement</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {METHODS.map((m) => {
                  const info = PAYMENT_METHOD_LABELS[m];
                  const isSelected = method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-xs font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-input hover:border-primary/50",
                      )}
                    >
                      <span className="text-lg">{info.emoji}</span>
                      <span className="text-[10px]">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REFERENCE */}
            {needsReference && (
              <div>
                <Label htmlFor="reference">
                  Référence {method === "MOBILE_MONEY" ? "(N° transaction)" : ""}
                </Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={
                    method === "MOBILE_MONEY"
                      ? "Ex: OM-20261012-1234"
                      : method === "CHECK"
                        ? "Ex: N° chèque"
                        : "Ex: N° virement"
                  }
                  className="mt-1 font-mono"
                  maxLength={80}
                />
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              Enregistrer le paiement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
