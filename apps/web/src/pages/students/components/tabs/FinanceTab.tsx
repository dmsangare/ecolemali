import {
  Wallet, Receipt, AlertCircle, CheckCircle2, Clock, TrendingUp,
  TrendingDown, Printer, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatusBadge, BadgeVariant, EmptyState } from "@/components/shared";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { StudentDetail } from "@/types/student";

interface FinanceTabProps {
  student: StudentDetail;
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Impaye",
  PARTIAL: "Partiel",
  PAID: "Paye",
  OVERDUE: "En retard",
  CANCELLED: "Annule",
};

const INVOICE_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "gray",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Especes",
  TRANSFER: "Virement",
  CHECK: "Cheque",
  MOBILE_MONEY: "Mobile Money",
  OTHER: "Autre",
};

export function FinanceTab({ student }: FinanceTabProps) {
  const invoices = student.invoices || [];
  const unpaidAmount = Number(student.unpaidAmount || 0);

  // Calculer les totaux
  const totalBilled = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);

  const overallStatus =
    unpaidAmount === 0 && totalBilled > 0
      ? "PAID"
      : totalPaid > 0
      ? "PARTIAL"
      : "UNPAID";

  return (
    <div className="space-y-6">
      {/* Bandeau statut global */}
      <Card
        className={
          overallStatus === "PAID"
            ? "border-green-200 bg-green-50/30"
            : overallStatus === "PARTIAL"
            ? "border-orange-200 bg-orange-50/30"
            : "border-red-200 bg-red-50/30"
        }
      >
        <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {overallStatus === "PAID" ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : overallStatus === "PARTIAL" ? (
              <Clock className="h-8 w-8 text-orange-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                {overallStatus === "PAID"
                  ? "Situation a jour"
                  : overallStatus === "PARTIAL"
                  ? "Paiement partiel"
                  : "Solde impaye"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {invoices.length} facture(s) enregistree(s)
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Solde restant</p>
            <p
              className={`text-2xl font-bold ${
                unpaidAmount > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(unpaidAmount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3 KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Total facture</p>
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Total paye</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Reste a payer</p>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(unpaidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Factures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Factures
            </span>
            {invoices.length > 0 && (
              <StatusBadge label={`${invoices.length}`} variant="info" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8 text-muted-foreground/50" />}
              title="Aucune facture"
              description="Les factures apparaitront ici une fois emises."
              className="h-40"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Numero</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-4 py-3 text-right">Paye</th>
                    <th className="px-4 py-3 text-right">Solde</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-mono">
                        {inv.number}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(inv.issuedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                        {formatCurrency(inv.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={
                            INVOICE_STATUS_LABELS[inv.status] || inv.status
                          }
                          variant={INVOICE_STATUS_VARIANTS[inv.status] || "gray"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Imprimer la facture"
                          onClick={() =>
                            alert("Impression facture a implementer")
                          }
                        >
                          <Printer className="h-4 w-4" />
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

      {/* Historique paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" />
            Historique des paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student._count?.payments && student._count.payments > 0 ? (
            <p className="text-sm text-muted-foreground">
              {student._count.payments} paiement(s) enregistre(s)
            </p>
          ) : (
            <div className="text-center py-6">
              <Wallet className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Aucun paiement enregistre
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Les paiements apparaitront ici une fois enregistres
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Documents financiers</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generez les documents officiels
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4" />
                Attestation de paiement
              </Button>
              <Button variant="outline" size="sm">
                <Receipt className="h-4 w-4" />
                Releve financier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
