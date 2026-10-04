import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Wallet,
  Receipt,
  Calendar,
  User,
  FileText,
  Ban,
  MessageCircle,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePayment } from "@/hooks/finance";
import { SendWhatsAppModal } from "./components/SendWhatsAppModal";
import {
  PAYMENT_METHOD_LABELS,
  formatFCFA,
  type PaymentMethod,
} from "@/types/finance";

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: payment, isLoading } = usePayment(id);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">Paiement introuvable</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/payments">Retour aux paiements</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const methodInfo =
    PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] ||
    PAYMENT_METHOD_LABELS.CASH;
  const isCancelled = !!payment.cancelledAt;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <Link
          to="/payments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paiements
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <Wallet className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {payment.receiptNumber || "Paiement"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                <span>
                  {new Date(payment.paidAt).toLocaleString("fr-FR")}
                </span>
                <span>· {methodInfo.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCancelled && (
              <Button
                variant="outline"
                onClick={() => setWhatsappOpen(true)}
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Envoyer par WhatsApp
              </Button>
            )}
            {isCancelled && (
              <span className="inline-block px-3 py-1.5 rounded text-sm font-medium bg-red-500/10 text-red-700">
                Annulé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MONTANT */}
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase mb-1">
              Montant payé
            </div>
            <div
              className={cn(
                "text-4xl font-bold font-mono",
                isCancelled ? "text-muted-foreground line-through" : "text-green-600",
              )}
            >
              {formatFCFA(payment.amount)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DÉTAILS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Élève
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="Nom"
              value={
                payment.student
                  ? `${payment.student.lastName} ${payment.student.firstName}`
                  : "—"
              }
            />
            <Row
              label="Matricule"
              value={payment.student?.matricule || "—"}
              mono
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Facture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="N° facture"
              value={(payment.invoice as any)?.number || "—"}
              mono
            />
            <Row
              label="Total facture"
              value={formatFCFA((payment.invoice as any)?.totalAmount || 0)}
            />
            <Row
              label="Solde facture"
              value={formatFCFA((payment.invoice as any)?.balance || 0)}
            />
          </CardContent>
        </Card>
      </div>

      {/* INFOS PAIEMENT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informations du paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Méthode" value={methodInfo.label} />
          {payment.reference && (
            <Row label="Référence" value={payment.reference} mono />
          )}
          <Row
            label="Caissier"
            value={
              payment.cashier
                ? `${payment.cashier.firstName} ${payment.cashier.lastName}`
                : "—"
            }
          />
          {payment.cancelledAt && (
            <>
              <Row
                label="Annulé le"
                value={new Date(payment.cancelledAt).toLocaleString("fr-FR")}
              />
              {payment.cancelReason && (
                <Row label="Raison" value={payment.cancelReason} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">Reçu de paiement</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Téléchargez le reçu officiel au format PDF
            </p>
          </div>
          <ReceiptPDFButton paymentId={payment.id} disabled={isCancelled} />
        </CardContent>
      </Card>

      {whatsappOpen && payment.student && (
        <SendWhatsAppModal
          student={{
            firstName: payment.student.firstName,
            lastName: payment.student.lastName,
            matricule: payment.student.matricule,
            guardians: (payment.student as any).guardians || [],
          }}
          schoolName="SIS-MALI"
          paymentAmount={Number(payment.amount)}
          paymentDate={payment.paidAt}
          receiptNumber={payment.receiptNumber}
          invoiceNumber={(payment.invoice as any)?.number || null}
          onClose={() => setWhatsappOpen(false)}
        />
      )}

    </div>
  );
}

import { ReceiptPDFButton } from "./components/ReceiptPDFButton";

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-right", mono && "font-mono")}>
        {value || "—"}
      </span>
    </div>
  );
}
