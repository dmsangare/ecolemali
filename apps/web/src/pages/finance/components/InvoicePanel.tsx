import { useEffect, useMemo } from "react";
import { Loader2, Receipt, AlertCircle, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useInvoices, useInvoice, useInvoiceInstallments } from "@/hooks/finance";
import { InstallmentsList } from "./InstallmentsList";
import { formatFCFA, type Invoice, type InvoiceInstallment } from "@/types/finance";

interface StudentLite {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  enrollments?: Array<{
    id: string;
    academicYearId: string;
    class?: { id: string; name: string } | null;
    level?: { id: string; name: string } | null;
  }>;
}

interface Props {
  student: StudentLite;
  onSelectInvoice: (invoice: Invoice | null) => void;
  onPayInstallment: (installment: InvoiceInstallment) => void;
}

export function InvoicePanel({
  student,
  onSelectInvoice,
  onPayInstallment,
}: Props) {
  // 1. Recuperer les factures de l'eleve
  const { data: invoicesPage, isLoading: loadingInvoices } = useInvoices({
    studentId: student.id,
    limit: 20,
  });

  // 2. Extraire la liste
  const invoices: Invoice[] = useMemo(() => {
    if (!invoicesPage) return [];
    if (Array.isArray(invoicesPage)) return invoicesPage;
    return invoicesPage.items || invoicesPage.data || [];
  }, [invoicesPage]);

  // 3. Choisir la facture active : premiere non soldee, sinon la plus recente
  const activeInvoiceLite = useMemo(() => {
    if (invoices.length === 0) return null;
    const unpaid = invoices.find(
      (inv) => inv.status !== "PAID" && inv.status !== "CANCELLED",
    );
    return unpaid || invoices[0];
  }, [invoices]);

  // 3.b. Charger la facture DETAILLEE (avec items) pour transmission au parent
  const { data: activeInvoiceDetail } = useInvoice(activeInvoiceLite?.id);
  const activeInvoice = activeInvoiceDetail || activeInvoiceLite;

  // 4. Signaler la facture active (avec items) au parent
  useEffect(() => {
    onSelectInvoice(activeInvoice);
  }, [activeInvoice, onSelectInvoice]);

  // 5. Recuperer les echeances de la facture active
  const { data: installments, isLoading: loadingInstallments } =
    useInvoiceInstallments(activeInvoice?.id);

  // 6. Infos eleve
  const enrollment = student.enrollments?.[0];
  const className =
    enrollment?.class?.name || enrollment?.level?.name || "Non inscrit";

  // 7. Loader
  if (loadingInvoices) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // 8. Aucune facture
  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucune facture</p>
          <p className="text-xs mt-1">
            Cet élève n'a pas encore de facture
          </p>
        </CardContent>
      </Card>
    );
  }

  const balance = Number(activeInvoice?.balance || 0);
  const isPaid = activeInvoice?.status === "PAID";

  return (
    <div className="space-y-3">
      {/* En-tete élève + facture */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">
                {student.lastName} {student.firstName}
              </p>
              <p className="text-xs text-muted-foreground">
                {className} · {student.matricule}
              </p>
            </div>
          </div>

          {invoices.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {invoices.length} factures · sélection automatique de la plus
              urgente
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Facture active</p>
              <p className="font-mono text-sm font-medium">
                {activeInvoice?.number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {isPaid ? "Solde" : "Reste à payer"}
              </p>
              <p
                className={cn(
                  "font-mono font-semibold text-lg",
                  isPaid ? "text-green-600" : "text-orange-600",
                )}
              >
                {formatFCFA(balance)}
              </p>
            </div>
          </div>

          {isPaid && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
              <AlertCircle className="h-4 w-4" />
              Cette facture est entièrement soldée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Echeances */}
      {loadingInstallments ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
          </CardContent>
        </Card>
      ) : (
        <InstallmentsList
          installments={installments || []}
          onPayInstallment={onPayInstallment}
          disabled={isPaid}
        />
      )}
    </div>
  );
}
