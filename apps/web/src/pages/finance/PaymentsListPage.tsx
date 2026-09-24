import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Search,
  Loader2,
  Eye,
  Plus,
  TrendingUp,
  Ban,
  FileText,
} from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  usePayments,
  useTodayTotal,
  useCancelPayment,
} from "@/hooks/finance";
import {
  PAYMENT_METHOD_LABELS,
  formatFCFA,
  type Payment,
  type PaymentMethod,
} from "@/types/finance";
import { CreatePaymentModal } from "./components/CreatePaymentModal";

const METHODS: PaymentMethod[] = ["CASH", "MOBILE_MONEY", "TRANSFER", "CHECK", "OTHER"];

export function PaymentsListPage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const filters: any = {};
  if (methodFilter) filters.method = methodFilter;

  const { data, isLoading } = usePayments(filters);
  const { data: todayTotal } = useTodayTotal();
  const cancelMutation = useCancelPayment();

  const paymentList = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any).data || [];
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return paymentList;
    const q = search.toLowerCase();
    return paymentList.filter((p: Payment) => {
      const name = `${p.student?.lastName || ""} ${p.student?.firstName || ""}`;
      return (
        name.toLowerCase().includes(q) ||
        p.student?.matricule?.toLowerCase().includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        p.receiptNumber?.toLowerCase().includes(q)
      );
    });
  }, [paymentList, search]);

  // Stats
  const totalFiltered = filtered.reduce((sum: number, p: Payment) => {
    if (p.cancelledAt) return sum;
    return sum + Number(p.amount);
  }, 0);

  const handleCancel = (payment: Payment) => {
    const reason = window.prompt(
      "Raison de l'annulation ?",
      "Erreur de saisie",
    );
    if (!reason) return;
    cancelMutation.mutate({ id: payment.id, dto: { reason } });
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Paiements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {paymentList.length} paiement(s) · {formatFCFA(totalFiltered)} affiché(s)
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau paiement
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Total du jour"
          value={formatFCFA(todayTotal?.total || 0)}
          subtitle={`${todayTotal?.count || 0} paiement(s)`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-green-600"
        />
        <StatCard
          label="Total affiché"
          value={formatFCFA(totalFiltered)}
          subtitle={`${filtered.length} paiement(s)`}
          icon={<Wallet className="h-4 w-4" />}
          color="text-blue-600"
        />
        <StatCard
          label="Annulés"
          value={String(
            paymentList.filter((p: Payment) => p.cancelledAt).length,
          )}
          subtitle="Sur la période"
          icon={<Ban className="h-4 w-4" />}
          color="text-red-600"
        />
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">💳 Toutes les méthodes</option>
          {METHODS.map((m) => {
            const info = PAYMENT_METHOD_LABELS[m];
            return (
              <option key={m} value={m}>
                {info.emoji} {info.label}
              </option>
            );
          })}
        </select>

        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (élève, matricule, référence, n° reçu)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* CONTENU */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Wallet className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucun paiement trouvé</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Enregistrez votre premier paiement
            </p>
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau paiement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-medium">N° reçu</th>
                    <th className="text-left p-3 font-medium">Élève</th>
                    <th className="text-left p-3 font-medium">Facture</th>
                    <th className="text-right p-3 font-medium">Montant</th>
                    <th className="text-center p-3 font-medium">Méthode</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: Payment) => {
                    const methodInfo =
                      PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ||
                      PAYMENT_METHOD_LABELS.CASH;
                    const isCancelled = !!p.cancelledAt;

                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b last:border-0 hover:bg-muted/30",
                          isCancelled && "opacity-60",
                        )}
                      >
                        <td className="p-3 font-mono text-xs">
                          {p.receiptNumber ? (
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3 w-3 text-blue-500" />
                              {p.receiptNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          {p.student ? (
                            <div>
                              <div className="font-medium">
                                {p.student.lastName} {p.student.firstName}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {p.student.matricule}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {(p.invoice as any)?.number || "—"}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-green-600">
                          {formatFCFA(p.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
                              methodInfo.color,
                            )}
                          >
                            <span>{methodInfo.emoji}</span>
                            {methodInfo.label}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(p.paidAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/payments/${p.id}`}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            {!isCancelled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(p)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODALE */}
      {createOpen && (
        <CreatePaymentModal onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}

// ============================================================
function StatCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}
