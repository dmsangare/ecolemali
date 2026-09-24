import { useState } from 'react';
import {
  useCurrentCashSession,
  useOpenCashSession,
  useCloseCashSession,
  useCashSessions,
} from '@/hooks/finance/useCashSessions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import { Wallet, Lock, Unlock, AlertTriangle, TrendingUp } from 'lucide-react';

export function CashSessionsListPage() {
  const { data: current, isLoading } = useCurrentCashSession();
  const { data: history } = useCashSessions({ page: 1, limit: 10 });
  const openMutation = useOpenCashSession();
  const closeMutation = useCloseCashSession();

  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');

  if (isLoading) return <div className="p-6">Chargement…</div>;

  const isOpen = current?.status === 'OPEN';
  const opening = current ? Number(current.openingAmount) : 0;
  const theoretical = current?.theoreticalBalance ?? 0;
  const closing = Number(closingBalance || 0);

  return (
    <div className="p-6 space-y-6">
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

      {!isOpen && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Ouvrir une session de caisse</h2>
          <div>
            <label className="text-sm text-gray-600">Fond de caisse initial (FCFA)</label>
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

      {isOpen && current && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-500">Fond initial</p>
              <p className="text-xl font-bold">{formatCurrency(opening)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Encaissé espèces</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(current.totalCash ?? 0)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Autres méthodes</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(current.totalOther ?? 0)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Solde théorique</p>
              <p className="text-xl font-bold">{formatCurrency(theoretical)}</p>
            </Card>
          </div>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Clôturer la session
            </h2>
            <div>
              <label className="text-sm text-gray-600">Comptage réel espèces (FCFA)</label>
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
                Écart :{' '}
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
              {closeMutation.isPending ? 'Clôture…' : 'Clôturer la caisse'}
            </Button>
          </Card>
        </>
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Historique des sessions</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="pb-2">Date clôture</th>
              <th className="pb-2 text-right">Fond initial</th>
              <th className="pb-2 text-right">Théorique</th>
              <th className="pb-2 text-right">Réel</th>
              <th className="pb-2 text-right">Écart</th>
            </tr>
          </thead>
          <tbody>
            {history?.items?.map((s: any) => (
              <tr key={s.id} className="border-b">
                <td className="py-2">
                  {s.closedAt ? new Date(s.closedAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="py-2 text-right">{formatCurrency(Number(s.openingAmount))}</td>
                <td className="py-2 text-right">{formatCurrency(Number(s.expectedAmount ?? 0))}</td>
                <td className="py-2 text-right">{formatCurrency(Number(s.closingAmount ?? 0))}</td>
                <td
                  className={`py-2 text-right font-semibold ${
                    Number(s.difference) === 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(Number(s.difference ?? 0))}
                </td>
              </tr>
            ))}
            {!history?.items?.length && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-400">
                  Aucune session clôturée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
