import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  UsersRound,
  School,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Receipt,
  GraduationCap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { reportsApi } from "@/api/reports";
import { api } from "@/lib/axios";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KpiCard,
  PageLoader,
  ErrorState,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { SetupChecklist } from "./SetupChecklist";
import { SetupBanner } from "@/components/setup/SetupBanner";
import { ClosingYearCard } from "./ClosingYearCard";
import { AdminGenderDistribution } from "./AdminDashboard.stats";

export function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => reportsApi.dashboard(),
  });

  const { data: financial } = useQuery({
    queryKey: ["dashboard-financial"],
    queryFn: () => reportsApi.financial(),
  });

  const { data: attendance } = useQuery({
    queryKey: ["dashboard-attendance"],
    queryFn: () => reportsApi.attendance(),
  });

  const { data: unpaid } = useQuery({
    queryKey: ["dashboard-unpaid"],
    queryFn: async () => {
      try {
        const res = await api.get("/invoices", {
          params: { status: "UNPAID", limit: 5 },
        });
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["dashboard-payments"],
    queryFn: async () => {
      try {
        const res = await api.get("/payments", { params: { limit: 5 } });
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  const { data: upcomingExams } = useQuery({
    queryKey: ["dashboard-exams"],
    queryFn: async () => {
      try {
        const res = await api.get("/exams", {
          params: { status: "PLANNED", limit: 5 },
        });
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  if (isLoading) return <PageLoader label="Chargement du tableau de bord..." />;

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Impossible de charger les statistiques"
          description="Une erreur est survenue lors de la récupération des données."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const recoveryRate =
    (stats?.totalBilled ?? 0) > 0
      ? ((stats?.revenueAmount ?? 0) / (stats?.totalBilled ?? 1)) * 100
      : 0;

  const unpaidList = (unpaid as any)?.data ?? [];
  const paymentList = (recentPayments as any)?.data ?? [];
  const examsList = (upcomingExams as any)?.data ?? [];
  const attendanceData: any = attendance ?? {};
  const financialData: any = financial ?? {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Bandeau assistant démarrage */}
      <SetupBanner />
      <SetupChecklist />
      <ClosingYearCard />

      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici un aperçu de votre établissement.
          </p>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* KPI — Ligne 1 : population */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Élèves"
          value={stats?.studentsCount || 0}
          hint={`${stats?.genderSplit.boys || 0} garçons, ${stats?.genderSplit.girls || 0} filles`}
          icon={<Users className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Enseignants"
          value={stats?.teachersCount || 0}
          hint="Personnel enseignant actif"
          icon={<UsersRound className="h-5 w-5" />}
          accent="info"
        />
        <KpiCard
          label="Classes"
          value={stats?.classesCount || 0}
          hint="Classes actives"
          icon={<School className="h-5 w-5" />}
          accent="neutral"
        />
        <KpiCard
          label="Taux de présence"
          value={`${stats?.attendanceRate || 0}%`}
          hint="Moyenne générale"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
      </div>

      {/* KPI — Ligne 2 : finances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Recettes"
          value={formatCurrency(stats?.revenueAmount || 0)}
          hint={`Sur ${formatCurrency(stats?.totalBilled || 0)} facturés`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="success"
        />
        <KpiCard
          label="Impayés"
          value={formatCurrency(stats?.unpaidAmount || 0)}
          hint="Reste à recouvrer"
          icon={<TrendingDown className="h-5 w-5" />}
          accent="danger"
        />
        <KpiCard
          label="Taux recouvrement"
          value={`${recoveryRate.toFixed(1)}%`}
          hint={
            recoveryRate >= 70
              ? "Objectif atteint"
              : recoveryRate >= 40
              ? "En progression"
              : "À améliorer"
          }
          icon={<Wallet className="h-5 w-5" />}
          accent={
            recoveryRate >= 70
              ? "success"
              : recoveryRate >= 40
              ? "warning"
              : "danger"
          }
        />
        <KpiCard
          label="Absences du jour"
          value={attendanceData?.todayAbsences ?? 0}
          hint="À traiter"
          icon={<AlertCircle className="h-5 w-5" />}
          accent="warning"
        />
      </div>

      {/* Ligne 3 : Impayés + Paiements récents */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-sis-danger" />
              Impayés récents
            </CardTitle>
            <Link
              to="/invoices"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {unpaidList.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Aucun impayé"
                  description="Tous les paiements sont à jour."
                />
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {unpaidList.slice(0, 5).map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition">
                      <td className="p-3">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="hover:underline"
                        >
                          <span className="font-mono text-xs">
                            {inv.number}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {inv.student?.firstName} {inv.student?.lastName}
                          </span>
                        </Link>
                      </td>
                      <td className="p-3 text-right">
                        <StatusBadge variant="danger" showIcon={false}>
                          {formatCurrency(inv.balance)}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-sis-success" />
              Paiements récents
            </CardTitle>
            <Link
              to="/payments"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {paymentList.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Aucun paiement"
                  description="Aucun paiement enregistré récemment."
                />
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {paymentList.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition">
                      <td className="p-3">
                        {p.student?.firstName} {p.student?.lastName}
                        <span className="block text-xs text-muted-foreground">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <StatusBadge variant="success" showIcon={false}>
                          {formatCurrency(p.amount)}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ligne 4 : Examens + Répartition */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-sis-brand" />
              Examens planifiés
            </CardTitle>
            <Link
              to="/exams"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {examsList.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Aucun examen planifié"
                  description="Aucun examen n'est programmé pour le moment."
                />
              </div>
            ) : (
              <div className="divide-y">
                {examsList.slice(0, 5).map((e: any) => (
                  <Link
                    key={e.id}
                    to={`/exams/${e.id}`}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition"
                  >
                    <div>
                      <p className="font-medium text-sm">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.startDate)}
                      </p>
                    </div>
                    <StatusBadge variant="info" showIcon={false}>
                      {e.type}
                    </StatusBadge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AdminGenderDistribution
          boys={stats?.genderSplit.boys || 0}
          girls={stats?.genderSplit.girls || 0}
        />
      </div>
    </div>
  );
}