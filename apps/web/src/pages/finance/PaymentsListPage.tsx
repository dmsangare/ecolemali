import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Eye,
  Download,
  Plus,
  TrendingUp,
  Ban,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Button,
  Input,
  PageLoader,
  EmptyState,
  KpiCard,
  StatusBadge,
} from "@/components/ui";
import { DataTable, Column } from "@/components/shared";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
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

const METHODS: PaymentMethod[] = [
  "CASH",
  "MOBILE_MONEY",
  "TRANSFER",
  "CHECK",
  "OTHER",
];

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

function getMethodVariant(method: string): BadgeVariant {
  switch (method) {
    case "CASH":
      return "success";
    case "MOBILE_MONEY":
      return "info";
    case "TRANSFER":
      return "brand" as any;
    case "CHECK":
      return "warning";
    case "OTHER":
      return "neutral";
    default:
      return "neutral";
  }
}

export function PaymentsListPage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filters: Record<string, string> = {};
  if (methodFilter) filters.method = methodFilter;

  const { data, isLoading } = usePayments(filters);
  const { data: todayTotal } = useTodayTotal();
  const cancelMutation = useCancelPayment();

  const paymentList: Payment[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any).data || [];
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return paymentList;
    const q = search.toLowerCase();
    return paymentList.filter((p) => {
      const name = `${p.student?.lastName || ""} ${p.student?.firstName || ""}`;
      return (
        name.toLowerCase().includes(q) ||
        p.student?.matricule?.toLowerCase().includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        p.receiptNumber?.toLowerCase().includes(q)
      );
    });
  }, [paymentList, search]);

  const totalFiltered = filtered.reduce((sum, p) => {
    if (p.cancelledAt) return sum;
    return sum + Number(p.amount);
  }, 0);

  const cancelledCount = paymentList.filter((p) => p.cancelledAt).length;

  const hasFilters = Boolean(search || methodFilter);

  const handleReset = () => {
    setSearch("");
    setMethodFilter("");
  };

  const handleCancel = (payment: Payment) => {
    const reason = window.prompt("Raison de l'annulation ?", "Erreur de saisie");
    if (!reason) return;
    cancelMutation.mutate({ id: payment.id, dto: { reason } });
  };

  const handleDownloadPdf = async (
    receiptId: string,
    receiptNumber: string,
  ) => {
    setDownloadingId(receiptId);
    try {
      const response = await api.get(`/receipts/${receiptId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `recu-${receiptNumber || "paiement"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors du téléchargement du reçu");
    } finally {
      setDownloadingId(null);
    }
  };

  // ============================================================
  // Colonnes du tableau
  // ============================================================
  const columns: Column<Payment>[] = [
    {
      key: "receipt",
      header: "N° reçu",
      cell: (p) =>
        p.receiptNumber ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs">
            <FileText className="h-3 w-3 text-sis-brand" />
            {p.receiptNumber}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "student",
      header: "Élève",
      cell: (p) =>
        p.student ? (
          <div>
            <div className="font-medium">
              {p.student.lastName} {p.student.firstName}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {p.student.matricule}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "invoice",
      header: "Facture",
      cell: (p) => (
        <span className="font-mono text-xs text-muted-foreground">
          {(p.invoice as any)?.number || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      headerClassName: "text-right",
      className: "text-right",
      cell: (p) => (
        <span
          className={cn(
            "font-mono font-semibold",
            p.cancelledAt ? "text-muted-foreground line-through" : "text-sis-success",
          )}
        >
          {formatFCFA(p.amount)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Méthode",
      headerClassName: "text-center",
      className: "text-center",
      cell: (p) => {
        const info =
          PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ||
          PAYMENT_METHOD_LABELS.CASH;
        return (
          <StatusBadge
            variant={getMethodVariant(p.method)}
            showIcon={false}
          >
            <span className="mr-1">{info.emoji}</span>
            {info.label}
          </StatusBadge>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      cell: (p) => (
        <span className="text-muted-foreground text-xs">
          {new Date(p.paidAt).toLocaleString("fr-FR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (p) => <PaymentActions payment={p} onCancel={handleCancel} onDownloadPdf={handleDownloadPdf} downloadingId={downloadingId} />,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sis-md bg-sis-success-bg text-sis-success mt-0.5 dark:bg-sis-success-bg/30">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {paymentList.length} paiement(s) · {formatFCFA(totalFiltered)}{" "}
              affiché(s)
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau paiement
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total du jour"
          value={formatFCFA(todayTotal?.total || 0)}
          hint={`${todayTotal?.count || 0} paiement(s) aujourd'hui`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="success"
        />
        <KpiCard
          label="Total affiché"
          value={formatFCFA(totalFiltered)}
          hint={`${filtered.length} paiement(s) selon filtres`}
          icon={<Wallet className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Annulés"
          value={String(cancelledCount)}
          hint="Sur la période"
          icon={<Ban className="h-5 w-5" />}
          accent="danger"
        />
      </div>

      {/* FILTRES */}
      <div className="rounded-sis-lg border border-sis-neutral-200 bg-card p-4 dark:border-sis-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-10 rounded-sis-md border border-sis-neutral-200 bg-card px-3 text-sm transition-colors hover:border-sis-neutral-300 focus:outline-none focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700 dark:bg-sis-neutral-900"
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

          <Input
            placeholder="Rechercher (élève, matricule, référence, n° reçu)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:col-span-2 rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
          />
        </div>

        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      {/* TABLEAU OU ÉTAT */}
      {isLoading ? (
        <PageLoader label="Chargement des paiements..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-7 w-7" />}
          title="Aucun paiement trouvé"
          description={
            hasFilters
              ? "Essayez de modifier les filtres de recherche."
              : "Enregistrez votre premier paiement pour commencer."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={handleReset}>
                Réinitialiser les filtres
              </Button>
            ) : (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau paiement
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(p) => p.id}
          rowClassName={(p) => (p.cancelledAt ? "opacity-60" : "")}
        />
      )}

      {/* MODALE */}
      {createOpen && (
        <CreatePaymentModal onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}

// ============================================================
// Composant Actions
// ============================================================
function PaymentActions({
  payment,
  onCancel,
  onDownloadPdf,
  downloadingId,
}: {
  payment: Payment;
  onCancel: (p: Payment) => void;
  onDownloadPdf: (receiptId: string, receiptNumber: string) => void;
  downloadingId: string | null;
}) {
  const isCancelled = !!payment.cancelledAt;

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link to={`/payments/${payment.id}`}>
          <Eye className="h-3.5 w-3.5" />
        </Link>
      </Button>
      {payment.receipt?.id && (
        <Button
          variant="ghost"
          size="sm"
          title="Télécharger le reçu PDF"
          onClick={() =>
            onDownloadPdf(payment.receipt!.id, payment.receipt!.number)
          }
          disabled={downloadingId === payment.receipt.id}
        >
          {downloadingId === payment.receipt.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
      {!isCancelled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCancel(payment)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Annuler le paiement"
        >
          <Ban className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}