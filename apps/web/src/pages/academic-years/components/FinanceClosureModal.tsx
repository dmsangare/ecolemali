import { useState } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  Info,
} from "lucide-react";
import { Button, Card, CardContent, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useFinanceClosurePreview,
  useExecuteFinanceClosure,
} from "@/hooks/finance-closure";
import type { AcademicYear } from "@/api/academic-years";

interface Props {
  year: AcademicYear;
  onClose: () => void;
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export function FinanceClosureModal({ year, onClose }: Props) {
  const { data: preview, isLoading } = useFinanceClosurePreview(year.id);
  const executeMutation = useExecuteFinanceClosure();

  const [carryOverDebts, setCarryOverDebts] = useState(true);
  const [carryOverCredits, setCarryOverCredits] = useState(true);
  const [ignoreBlockers, setIgnoreBlockers] = useState(false);
  const [result, setResult] = useState<{
    carriedInvoicesCount: number;
    creditedAccountsCount: number;
    totalDebtCarried: number;
    totalCreditCarried: number;
    nextYearLabel: string | null;
  } | null>(null);

  const handleExecute = async () => {
    try {
      const res = await executeMutation.mutateAsync({
        yearId: year.id,
        carryOverDebts,
        carryOverCredits,
        ignoreOpenCashSessions: ignoreBlockers,
      });
      setResult({
        carriedInvoicesCount: res.carriedInvoicesCount,
        creditedAccountsCount: res.creditedAccountsCount,
        totalDebtCarried: res.totalDebtCarried,
        totalCreditCarried: res.totalCreditCarried,
        nextYearLabel: res.nextYearLabel,
      });
    } catch {
      // erreur geree par le hook
    }
  };

  // === ECRAN DE SUCCES ===
  if (result) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-background rounded-sis-lg shadow-2xl relative z-[10000] max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent className="p-8 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">
                Clôture financiere effectuee
              </h2>
              <p className="text-sm text-green-700 mt-1">
                Année <strong>{year.label}</strong>
                {result.nextYearLabel && (
                  <> reportée sur <strong>{result.nextYearLabel}</strong></>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs uppercase tracking-wide text-amber-700">
                  Impayés reportés
                </p>
                <p className="text-xl font-bold text-amber-900 mt-1">
                  {result.carriedInvoicesCount}
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  {formatFCFA(result.totalDebtCarried)}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs uppercase tracking-wide text-blue-700">
                  Crédits reportés
                </p>
                <p className="text-xl font-bold text-blue-900 mt-1">
                  {result.creditedAccountsCount}
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  {formatFCFA(result.totalCreditCarried)}
                </p>
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </CardContent>
        </div>
      </div>
    );
  }

  // === CHARGEMENT ===
  if (isLoading || !preview) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-background rounded-sis-lg shadow-2xl relative z-[10000] p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // === APERCU ===
  const hasBlockers = preview.blockers.length > 0;
  const canExecute = preview.canExecute || ignoreBlockers;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-sis-lg shadow-2xl relative z-[10000] max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Clôture financiere
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Année <strong>{year.label}</strong>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={executeMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* CORPS */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* INFO */}
          <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/50 p-3">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Cette opération va reporter les impayés sur la nouvelle année et
              créditer les comptes des élèves en avance. <strong>Action
              irreversible.</strong>
            </p>
          </div>

          {/* BLOCAGES */}
          {hasBlockers && (
            <Card className="border-red-300 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-red-900">
                      Blocages
                    </p>
                    <ul className="mt-1 ml-4 list-disc text-xs text-red-800">
                      {preview.blockers.map((b) => (
                        <li key={b.type}>
                          {b.label} : <strong>{b.count}</strong>
                        </li>
                      ))}
                    </ul>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ignoreBlockers}
                        onChange={(e) => setIgnoreBlockers(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-xs text-red-800 font-medium">
                        Forcer la clôture malgré les blocages (déconseillé)
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TOTAUX */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-semibold mb-3">Situation financière</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox
                  label="Factures"
                  value={preview.totals.invoicesCount}
                  sub={formatFCFA(preview.totals.totalBilled)}
                />
                <StatBox
                  label="Débiteurs"
                  value={preview.debtors.length}
                  sub={formatFCFA(preview.totals.totalDebt)}
                  color="amber"
                />
                <StatBox
                  label="Créditeurs"
                  value={preview.creditors.length}
                  sub={formatFCFA(preview.totals.totalCredit)}
                  color="blue"
                />
                <StatBox
                  label="Élèves réglés"
                  value={preview.settledCount}
                  sub="solde = 0"
                />
              </div>
            </CardContent>
          </Card>

          {/* ACTIONS */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-base font-semibold">Que faire des soldes ?</h3>

              <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={carryOverDebts}
                  onChange={(e) => setCarryOverDebts(e.target.checked)}
                  className="h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    Reporter les impayés ({preview.debtors.length})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Une facture de report est créée sur la nouvelle année pour
                    chaque élève débiteur. Total :{" "}
                    <strong>{formatFCFA(preview.totals.totalDebt)}</strong>
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={carryOverCredits}
                  onChange={(e) => setCarryOverCredits(e.target.checked)}
                  className="h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Reporter les crédits ({preview.creditors.length})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le solde créditeur de chaque élève est enregistré sur son
                    compte. Total :{" "}
                    <strong>{formatFCFA(preview.totals.totalCredit)}</strong>
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* APERCU DEBITEURS */}
          {preview.debtors.length > 0 && carryOverDebts && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-amber-600" />
                  Débiteurs Ã  reporter ({preview.debtors.length})
                </h3>
                <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                  {preview.debtors.map((d) => (
                    <div
                      key={d.studentId}
                      className="flex items-center justify-between py-1 border-b last:border-0"
                    >
                      <div>
                        <span className="font-medium">
                          {d.lastName.toUpperCase()} {d.firstName}
                        </span>
                        <span className="ml-2 text-muted-foreground font-mono">
                          {d.matricule}
                        </span>
                      </div>
                      <span className="font-mono text-amber-700 font-semibold">
                        {formatFCFA(d.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={executeMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!canExecute || executeMutation.isPending}
          >
            {executeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Clôturer financièrement
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color?: "amber" | "blue";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        color === "amber" && "border-amber-200 bg-amber-50/50",
        color === "blue" && "border-blue-200 bg-blue-50/50",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
    </div>
  );
}
