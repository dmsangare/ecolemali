import { useState } from "react";
import { Loader2, Search, Wallet } from "lucide-react";
import { useCurrentCashSession } from "@/hooks/finance/useCashSessions";
import { Card, CardContent } from "@/components/ui";
import { CashSessionOpenForm } from "./components/CashSessionOpenForm";
import { CashSessionHeader } from "./components/CashSessionHeader";
import { StudentPicker } from "./components/StudentPicker";
import { InvoicePanel } from "./components/InvoicePanel";
import { PaymentPanel } from "./components/PaymentPanel";
import { TodaySummary } from "./components/TodaySummary";
import type { Invoice, InvoiceInstallment } from "@/types/finance";

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

export function PointDeCaissePage() {
  const { data: session, isLoading } = useCurrentCashSession();
  const [student, setStudent] = useState<StudentLite | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [selectedInstallment, setSelectedInstallment] =
    useState<InvoiceInstallment | null>(null);

  // 1. Chargement
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Pas de session → formulaire d'ouverture
  if (!session) {
    return <CashSessionOpenForm />;
  }

  // 3. Session ouverte → interface complete
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <CashSessionHeader session={session} />

      {/* Barre de recherche */}
      <div className="border-b bg-card px-6 py-3">
        <div className="max-w-2xl">
          <StudentPicker
            value={student}
            onChange={(s) => {
              setStudent(s);
              setActiveInvoice(null);
              setSelectedInstallment(null);
            }}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto p-6">
        {!student ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                Recherchez un élève pour commencer
              </p>
              <p className="text-xs mt-1">
                Tapez un nom, un matricule ou un téléphone parent
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panneau facture */}
            <div>
              <InvoicePanel
                student={student}
                onSelectInvoice={setActiveInvoice}
                onPayInstallment={(inst: InvoiceInstallment) => {
                  setSelectedInstallment(inst);
                }}
              />
            </div>

            {/* Panneau encaissement */}
            <div>
              {activeInvoice ? (
                <PaymentPanel
                  invoice={activeInvoice}
                  studentId={student.id}
                  installment={selectedInstallment}
                  onPaymentSuccess={() => {
                    setSelectedInstallment(null);
                  }}
                  onClearInstallment={() => setSelectedInstallment(null)}
                />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">
                      Sélectionnez une facture
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recap du jour */}
      <TodaySummary />
    </div>
  );
}
