import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Plus,
  Eye,
  TrendingUp,
  Users,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useAttendanceSessions, useTodayAbsences } from "@/hooks/attendance";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { formatDate } from "@/lib/formatters";
import {
  Button,
  Input,
  PageLoader,
  EmptyState,
  KpiCard,
  StatusBadge,
} from "@/components/ui";
import { DataTable, Column } from "@/components/shared";
import { CreateAttendanceModal } from "./components/CreateAttendanceModal";
import { useAuth } from "@/contexts/AuthContext";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

function getRateVariant(rate: number): BadgeVariant {
  if (rate >= 90) return "success";
  if (rate >= 70) return "warning";
  return "danger";
}

export function AttendanceListPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("attendance:create");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    classId: "",
    subjectId: "",
    date: "",
  });
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useAttendanceSessions({
    page,
    limit: 20,
    ...filters,
  });
  const { data: todayAbsences } = useTodayAbsences();

  const { data: classes } = useQuery({
    queryKey: ["classes", "list"],
    queryFn: async () => (await api.get("/classes")).data?.data ?? [],
  });

  const sessions = data?.data || [];
  const meta = data?.meta;

  const stats = sessions.reduce(
    (
      acc: { total: number; present: number; absent: number; late: number },
      s: any,
    ) => {
      const records = s.records ?? [];
      acc.total += records.length;
      acc.present += records.filter((r: any) => r.status === "PRESENT").length;
      acc.absent += records.filter((r: any) =>
        r.status?.startsWith("ABSENT"),
      ).length;
      acc.late += records.filter((r: any) => r.status === "LATE").length;
      return acc;
    },
    { total: 0, present: 0, absent: 0, late: 0 },
  );
  const presenceRate =
    stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

  const hasFilters = Boolean(filters.classId || filters.date);
  const resetFilters = () =>
    setFilters({ classId: "", subjectId: "", date: "" });

  // ============================================================
  // Colonnes du tableau
  // ============================================================
  const columns: Column<any>[] = [
    {
      key: "date",
      header: "Date",
      cell: (s) => <span className="font-medium">{formatDate(s.date)}</span>,
    },
    {
      key: "class",
      header: "Classe",
      cell: (s) => s.class?.name || <span className="text-muted-foreground">—</span>,
    },
    {
      key: "subject",
      header: "Matière",
      cell: (s) => s.subject?.name || <span className="text-muted-foreground">—</span>,
    },
    {
      key: "teacher",
      header: "Enseignant",
      cell: (s) => (
        <span className="text-sm">
          {s.teacher
            ? `${s.teacher.firstName} ${s.teacher.lastName}`
            : "—"}
        </span>
      ),
    },
    {
      key: "present",
      header: "Présents",
      headerClassName: "text-center",
      className: "text-center",
      cell: (s) => {
        const records = s.records ?? [];
        const present = records.filter(
          (r: any) => r.status === "PRESENT",
        ).length;
        return <span className="font-semibold text-sis-success">{present}</span>;
      },
    },
    {
      key: "absent",
      header: "Absents",
      headerClassName: "text-center",
      className: "text-center",
      cell: (s) => {
        const records = s.records ?? [];
        const absent = records.filter((r: any) =>
          r.status?.startsWith("ABSENT"),
        ).length;
        return <span className="font-semibold text-sis-danger">{absent}</span>;
      },
    },
    {
      key: "rate",
      header: "Taux",
      headerClassName: "text-center",
      className: "text-center",
      cell: (s) => {
        const records = s.records ?? [];
        const present = records.filter(
          (r: any) => r.status === "PRESENT",
        ).length;
        const rate = records.length > 0 ? (present / records.length) * 100 : 0;
        return (
          <StatusBadge variant={getRateVariant(rate)} showIcon={false}>
            {rate.toFixed(0)} %
          </StatusBadge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (s) => (
        <Link to={`/attendance/${s.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Voir
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sis-md bg-sis-brand-50 text-sis-brand mt-0.5 dark:bg-sis-brand-900/30 dark:text-sis-brand-300">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Présences</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {meta?.total || 0} session(s) enregistrée(s)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle session
            </Button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Sessions"
          value={meta?.total || 0}
          hint="Total enregistré"
          icon={<ClipboardCheck className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Taux de présence"
          value={`${presenceRate.toFixed(1)} %`}
          hint="Sur la page courante"
          icon={<TrendingUp className="h-5 w-5" />}
          accent={
            presenceRate >= 90
              ? "success"
              : presenceRate >= 70
                ? "warning"
                : "danger"
          }
        />
        <KpiCard
          label="Présents"
          value={stats.present}
          hint="Sur la page courante"
          icon={<Users className="h-5 w-5" />}
          accent="info"
        />
        <KpiCard
          label="Absents du jour"
          value={todayAbsences?.length ?? 0}
          hint="À traiter aujourd'hui"
          icon={<AlertCircle className="h-5 w-5" />}
          accent="danger"
        />
      </div>

      {/* FILTRES */}
      <div className="rounded-sis-lg border border-sis-neutral-200 bg-card p-4 dark:border-sis-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filters.classId}
            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
            className="h-10 rounded-sis-md border border-sis-neutral-200 bg-card px-3 text-sm transition-colors hover:border-sis-neutral-300 focus:outline-none focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700 dark:bg-sis-neutral-900"
          >
            <option value="">🏫 Toutes les classes</option>
            {classes?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
          />

          {hasFilters && (
            <Button variant="ghost" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* TABLEAU OU ÉTAT */}
      {isLoading ? (
        <PageLoader label="Chargement des sessions..." />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="Aucune session de présence"
          description={
            hasFilters
              ? "Essayez de modifier les filtres."
              : "Créez votre première session pour commencer."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            ) : canCreate ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle session
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          data={sessions}
          columns={columns}
          keyExtractor={(s) => s.id}
        />
      )}

      {/* MODALE CRÉATION */}
      {showCreate && (
        <CreateAttendanceModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}