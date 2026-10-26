import { useState } from "react";
import {
  MessageCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Phone,
  CheckCircle2,
  TrendingDown,
  Clock,
  Users,
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
import { formatFCFA } from "@/types/finance";
import { useReminders } from "@/hooks/finance/useMessages";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { RemindWhatsAppModal } from "./components/RemindWhatsAppModal";
import type { Reminder } from "@/api/messages";

interface SchoolInfo {
  id: string;
  name: string;
  sigle?: string | null;
  phone?: string | null;
  address?: string | null;
}

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

function getLateVariant(days: number): BadgeVariant {
  if (days < 0) return "info";
  if (days <= 7) return "warning";
  if (days <= 30) return "warning";
  return "danger";
}

function getLateLabel(days: number): string {
  if (days < 0) return `dans ${Math.abs(days)}j`;
  if (days === 0) return "aujourd'hui";
  return `${days}j`;
}

export function RemindersListPage() {
  const [minDaysLate, setMinDaysLate] = useState(0);
  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const { data, isLoading, refetch } = useReminders(minDaysLate, includeUpcoming);

  const { data: school } = useQuery({
    queryKey: ["school-info"],
    queryFn: async () => {
      const { data } = await api.get("/schools");
      const list = data.data || data;
      return (Array.isArray(list) ? list[0] : list) as SchoolInfo;
    },
    staleTime: 30 * 60_000,
  });

  const reminders: Reminder[] = data?.items || [];
  const totalBalance = reminders.reduce((sum, r) => sum + r.balance, 0);
  const criticalCount = reminders.filter((r) => r.daysLate > 30).length;
  const withGuardian = reminders.filter((r) => r.guardian?.phone).length;

  const handleRefresh = () => {
    refetch();
    setRefreshKey((k) => k + 1);
  };

  // ============================================================
  // Colonnes du tableau
  // ============================================================
  const columns: Column<Reminder>[] = [
    {
      key: "invoice",
      header: "Facture",
      cell: (r) => (
        <span className="font-mono text-xs">{r.invoiceNumber}</span>
      ),
    },
    {
      key: "student",
      header: "Élève",
      cell: (r) => (
        <div>
          <div className="font-medium">
            {r.student.lastName} {r.student.firstName}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {r.student.matricule}
          </div>
        </div>
      ),
    },
    {
      key: "guardian",
      header: "Parent",
      cell: (r) =>
        r.guardian ? (
          <>
            <div className="font-medium">
              {r.guardian.firstName} {r.guardian.lastName}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" />
              {r.guardian.phone}
            </div>
          </>
        ) : (
          <span className="text-xs text-sis-danger">Aucun parent</span>
        ),
    },
    {
      key: "daysLate",
      header: "Retard",
      headerClassName: "text-center",
      className: "text-center",
      cell: (r) => (
        <StatusBadge
          variant={getLateVariant(r.daysLate)}
          showIcon={false}
        >
          {getLateLabel(r.daysLate)}
        </StatusBadge>
      ),
    },
    {
      key: "balance",
      header: "Solde",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <span className="font-mono font-semibold text-sis-danger">
          {formatFCFA(r.balance)}
        </span>
      ),
    },
    {
      key: "lastReminder",
      header: "Dernière relance",
      cell: (r) =>
        r.lastReminder ? (
          <>
            <div className="text-xs">
              {new Date(r.lastReminder.sentAt).toLocaleDateString("fr-FR")}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {r.lastReminder.channel}
            </div>
          </>
        ) : (
          <span className="text-xs italic text-muted-foreground">
            Jamais relancé
          </span>
        ),
    },
    {
      key: "actions",
      header: "Action",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <Button
          size="sm"
          disabled={!r.guardian?.phone}
          title={
            !r.guardian?.phone
              ? "Aucun téléphone renseigné"
              : "Relancer par WhatsApp"
          }
          onClick={() => setSelectedReminder(r)}
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
          Relancer
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-sis-warning" />
            Relances impayés
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {reminders.length} facture(s) en retard ·{" "}
            {formatFCFA(totalBalance)} à recouvrer
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Rafraîchir
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total à recouvrer"
          value={formatFCFA(totalBalance)}
          hint={`${reminders.length} facture(s)`}
          icon={<TrendingDown className="h-5 w-5" />}
          accent="danger"
        />
        <KpiCard
          label="Retards critiques"
          value={String(criticalCount)}
          hint="Plus de 30 jours"
          icon={<Clock className="h-5 w-5" />}
          accent="warning"
        />
        <KpiCard
          label="Contactables"
          value={String(withGuardian)}
          hint="Parents avec téléphone"
          icon={<Users className="h-5 w-5" />}
          accent="brand"
        />
      </div>

      {/* FILTRES */}
      <div className="rounded-sis-lg border border-sis-neutral-200 bg-card p-4 dark:border-sis-neutral-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">
              Jours de retard minimum :
            </label>
            <Input
              type="number"
              min={0}
              value={minDaysLate}
              onChange={(e) =>
                setMinDaysLate(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="w-24 rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUpcoming}
              onChange={(e) => setIncludeUpcoming(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-sis-brand"
            />
            <span className="text-sm font-medium">
              Inclure les factures à échoir
            </span>
          </label>

          <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sis-warning"></span>{" "}
              0-7j
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sis-warning"></span>{" "}
              8-30j
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sis-danger"></span>{" "}
              30j+
            </span>
          </div>
        </div>
      </div>

      {/* TABLEAU OU ÉTAT */}
      {isLoading ? (
        <PageLoader label="Chargement des relances..." />
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-7 w-7" />}
          title="Aucune relance à faire"
          description="Toutes les factures échues sont à jour ou aucune facture n'a de date d'échéance."
        />
      ) : (
        <DataTable
          data={reminders}
          columns={columns}
          keyExtractor={(r) => r.invoiceId}
        />
      )}

      {/* MODALE WHATSAPP */}
      {selectedReminder && (
        <RemindWhatsAppModal
          reminder={selectedReminder}
          schoolName={school?.name || "École"}
          schoolPhone={school?.phone}
          schoolAddress={school?.address}
          onClose={() => setSelectedReminder(null)}
          onSent={handleRefresh}
        />
      )}
    </div>
  );
}