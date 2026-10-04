import { useState } from 'react';
import {
  useCurrentCashSession,
  useOpenCashSession,
  useCloseCashSession,
  useCashSessions,
} from '@/hooks/finance/useCashSessions';
import { useCashSession } from '@/hooks/finance/useCashSessions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import {
  Wallet,
  Lock,
  Unlock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/axios';

export function CashSessionsListPage() {
  const { data: current, isLoading } = useCurrentCashSession();
  const { data: history } = useCashSessions({ page: 1, limit: 10 });
  const openMutation = useOpenCashSession();
  const closeMutation = useCloseCashSession();

  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Detail de la session courante (pour les mouvements)
  const { data: sessionDetail } = useCashSession(current?.id);

  const downloadPdf = async (sessionId: string) => {
    setDownloadingId(sessionId);
    try {
      const response = await api.get(`/cash-sessions/${sessionId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-caisse-${sessionId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors du telechargement du rapport');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) return <div className="p-6">Chargement…</div>;

  const isOpen = current?.status === 'OPEN';
  const opening = current ? Number(current.openingAmount) : 0;
  const totalCash = current?.totalCash ?? 0;
  const totalOther = current?.totalOther ?? 0;
  const totalExpenses = current?.totalExpenses ?? 0;
  const totalIn = totalCash + totalOther;
  const theoretical = current?.theoreticalBalance ?? 0;
  const movementsCount = current?.movementsCount ?? 0;
  const closing = Number(closingBalance || 0);

  const historyItems: any[] = (history as any)?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6" /> Caisse
        </h1>
        {isOpen ? (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center gap-1">
            <Unlock className="w-4 h-4" /> Session ouverte
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium flex items-center gap-1">
            <Lock className="w-4 h-4" /> Aucune session
          </span>
        )}
      </div>

      {/* OUVERTURE */}
      {!isOpen && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Ouvrir une session de caisse</h2>
          <div>
            <label className="text-sm text-gray-600">
              Fond de caisse initial (FCFA)
            </label>
            <Input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
            />
          </div>
          <Button
            onClick={() =>
              openMutation.mutate(
                { openingBalance: Number(openingBalance) },
                { onSuccess: () => setOpeningBalance('') },
              )
            }
            disabled={openMutation.isPending}
          >
            {openMutation.isPending ? 'Ouverture…' : 'Ouvrir la caisse'}
          </Button>
        </Card>
      )}

      {/* SESSION OUVERTE */}
      {isOpen && current && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500 uppercase">Fond initial</p>
              <p className="text-xl font-bold">{formatCurrency(opening)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 uppercase">Encaissements</p>
              <p className="text-xl font-bold text-green-600">
                +{formatCurrency(totalIn)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Especes : {formatCurrency(totalCash)} · Autres : {formatCurrency(totalOther)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 uppercase">Depenses</p>
              <p className="text-xl font-bold text-red-600">
                -{formatCurrency(totalExpenses)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 uppercase">Solde theorique</p>
              <p className="text-xl font-bold">{formatCurrency(theoretical)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 uppercase">Mouvements</p>
              <p className="text-xl font-bold">{movementsCount}</p>
            </Card>
          </div>

          {/* CLOTURE */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Cloturer la session
            </h2>
            <div>
              <label className="text-sm text-gray-600">
                Comptage reel especes (FCFA)
              </label>
              <Input
                type="number"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0"
              />
            </div>
            {closingBalance !== '' && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Ecart :{' '}
                <span
                  className={
                    closing - theoretical === 0
                      ? 'text-green-600 font-semibold'
                      : 'text-red-600 font-semibold'
                  }
                >
                  {formatCurrency(closing - theoretical)}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() =>
                  closeMutation.mutate(
                    { id: current.id, dto: { closingBalance: closing } },
                    { onSuccess: () => setClosingBalance('') },
                  )
                }
                disabled={closeMutation.isPending || closingBalance === ''}
              >
                {closeMutation.isPending ? 'Cloture…' : 'Cloturer la caisse'}
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadPdf(current.id)}
                disabled={downloadingId === current.id}
              >
                {downloadingId === current.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Telecharger le rapport PDF
              </Button>
            </div>
          </Card>

          {/* MOUVEMENTS */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">
              Mouvements de la session ({sessionDetail?.payments?.length ?? 0} encaissements · {sessionDetail?.expenses?.length ?? 0} depenses)
            </h2>
            {!sessionDetail ? (
              <div className="text-center text-gray-500 py-6 text-sm">
                Chargement des mouvements…
              </div>
            ) : (sessionDetail.payments?.length ?? 0) === 0 &&
              (sessionDetail.expenses?.length ?? 0) === 0 ? (
              <div className="text-center text-gray-500 py-6 text-sm">
                Aucun mouvement enregistre pour cette session.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 border-b">
                  <tr>
                    <th className="pb-2">Heure</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...(sessionDetail.payments ?? []).map((p: any) => ({
                      time: p.paidAt,
                      type: 'IN' as const,
                      label: p.student
                        ? `${p.student.lastName} ${p.student.firstName}`
                        : 'Encaissement',
                      detail: p.invoice ? `Facture ${p.invoice.number}` : null,
                      amount: Number(p.amount),
                      method: p.method,
                    })),
                    ...(sessionDetail.expenses ?? []).map((e: any) => ({
                      time: e.spentAt,
                      type: 'OUT' as const,
                      label: e.category
                        ? `${e.category.emoji || ''} ${e.category.name}`
                        : 'Depense',
                      detail: e.description,
                      amount: Number(e.amount),
                      method: 'CASH',
                    })),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(a.time).getTime() - new Date(b.time).getTime(),
                    )
                    .map((m, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 text-gray-500 text-xs font-mono">
                          {new Date(m.time).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2">
                          {m.type === 'IN' ? (
                            <span className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold">
                              <ArrowDownCircle className="w-3 h-3" />
                              Encaissement
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 text-xs font-semibold">
                              <ArrowUpCircle className="w-3 h-3" />
                              Depense
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          <div>{m.label}</div>
                          {m.detail && (
                            <div className="text-xs text-gray-500">{m.detail}</div>
                          )}
                        </td>
                        <td
                          className={`py-2 text-right font-mono font-semibold ${
                            m.type === 'IN' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {m.type === 'IN' ? '+' : '-'}
                          {formatCurrency(m.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {/* HISTORIQUE */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Historique des sessions</h2>
        {historyItems.length === 0 ? (
          <div className="text-center text-gray-500 py-6 text-sm">
            Aucune session cloturee
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="pb-2">Date cloture</th>
                <th className="pb-2">Caissier</th>
                <th className="pb-2 text-right">Fond</th>
                <th className="pb-2 text-right">Theorique</th>
                <th className="pb-2 text-right">Reel</th>
                <th className="pb-2 text-right">Ecart</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((s: any) => {
                const ecart = Number(s.difference || 0);
                return (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 text-gray-600 text-xs">
                      {s.closedAt
                        ? new Date(s.closedAt).toLocaleString('fr-FR')
                        : '—'}
                    </td>
                    <td className="py-2">
                      {s.cashier
                        ? `${s.cashier.firstName} ${s.cashier.lastName}`
                        : '—'}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatCurrency(Number(s.openingAmount))}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatCurrency(Number(s.expectedAmount || 0))}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatCurrency(Number(s.closingAmount || 0))}
                    </td>
                    <td
                      className={`py-2 text-right font-mono font-semibold ${
                        ecart === 0
                          ? 'text-green-600'
                          : ecart > 0
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {ecart > 0 ? '+' : ''}
                      {formatCurrency(ecart)}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadPdf(s.id)}
                        disabled={downloadingId === s.id}
                      >
                        {downloadingId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span className="ml-1.5">PDF</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
