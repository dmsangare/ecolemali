import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users, UsersRound, School, TrendingUp, TrendingDown,
  Wallet, CheckCircle2, Loader2, AlertCircle, Receipt,
  ClipboardCheck, GraduationCap, ArrowRight,
} from "lucide-react";
import { reportsApi } from "@/api/reports";
import { api } from "@/lib/axios";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { SetupChecklist } from "./SetupChecklist";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  trend?: string;
}

function StatCard({ title, value, icon: Icon, description, variant = "default", trend }: StatCardProps) {
  const colors: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    danger: "bg-red-500/10 text-red-600",
    warning: "bg-amber-500/10 text-amber-600",
    info: "bg-blue-500/10 text-blue-600",
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${colors[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
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
        const res = await api.get("/invoices", { params: { status: "UNPAID", limit: 5 } });
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
        const res = await api.get("/exams", { params: { status: "PLANNED", limit: 5 } });
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erreur lors du chargement des statistiques.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recoveryRate = (stats?.totalBilled ?? 0) > 0
    ? ((stats?.revenueAmount ?? 0) / (stats?.totalBilled ?? 1)) * 100
    : 0;

  const unpaidList = (unpaid as any)?.data ?? [];
  const paymentList = (recentPayments as any)?.data ?? [];
  const examsList = (upcomingExams as any)?.data ?? [];
  const financialData: any = financial ?? {};
  const attendanceData: any = attendance ?? {};

  return (
    <div className="p-6 space-y-6">
      {/* Assistant de demarrage */}
      <SetupChecklist />

      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici un aperçu de votre établissement
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* KPI Cards - Ligne 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Élèves"
          value={stats?.studentsCount || 0}
          icon={Users}
          description={`${stats?.genderSplit.boys || 0} garçons, ${stats?.genderSplit.girls || 0} filles`}
          variant="info"
        />
        <StatCard
          title="Enseignants"
          value={stats?.teachersCount || 0}
          icon={UsersRound}
          description="Personnel enseignant actif"
          variant="default"
        />
        <StatCard
          title="Classes"
          value={stats?.classesCount || 0}
          icon={School}
          description="Classes actives"
          variant="default"
        />
        <StatCard
          title="Taux de présence"
          value={`${stats?.attendanceRate || 0}%`}
          icon={CheckCircle2}
          description="Moyenne générale"
          variant="success"
        />
      </div>

      {/* KPI Cards - Ligne 2 (financier) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Recettes"
          value={formatCurrency(stats?.revenueAmount || 0)}
          icon={TrendingUp}
          description={`Sur ${formatCurrency(stats?.totalBilled || 0)} facturés`}
          variant="success"
        />
        <StatCard
          title="Impayés"
          value={formatCurrency(stats?.unpaidAmount || 0)}
          icon={TrendingDown}
          description="Reste à recouvrer"
          variant="danger"
        />
        <StatCard
          title="Taux recouvrement"
          value={`${recoveryRate.toFixed(1)}%`}
          icon={Wallet}
          description={`${stats?.totalBilled ? ((stats.revenueAmount / stats.totalBilled) * 100).toFixed(0) : 0}% du total facturé`}
          variant={recoveryRate >= 70 ? "success" : recoveryRate >= 40 ? "warning" : "danger"}
        />
        <StatCard
          title="Absences du jour"
          value={attendanceData?.todayAbsences ?? 0}
          icon={AlertCircle}
          description="À traiter"
          variant="warning"
        />
      </div>

      {/* Ligne 3 : Impayés + Paiements récents */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Impayés */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" /> Impayés récents
            </CardTitle>
            <Link to="/invoices" className="text-xs text-primary hover:underline flex items-center gap-1">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {unpaidList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun impayé 🎉</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="pb-2">Facture</th>
                    <th className="pb-2 text-right">Reste</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidList.slice(0, 5).map((inv: any) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-2">
                        <Link to={`/invoices/${inv.id}`} className="hover:underline">
                          <span className="font-mono text-xs">{inv.number}</span>
                          <span className="block text-xs text-muted-foreground">
                            {inv.student?.firstName} {inv.student?.lastName}
                          </span>
                        </Link>
                      </td>
                      <td className="py-2 text-right font-semibold text-red-600">
                        {formatCurrency(inv.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Paiements récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-green-600" /> Paiements récents
            </CardTitle>
            <Link to="/payments" className="text-xs text-primary hover:underline flex items-center gap-1">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {paymentList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="pb-2">Élève</th>
                    <th className="pb-2">Méthode</th>
                    <th className="pb-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentList.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">
                        {p.student?.firstName} {p.student?.lastName}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">{p.method}</td>
                      <td className="py-2 text-right font-semibold text-green-600">
                        {formatCurrency(p.amount)}
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
        {/* Examens à venir */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" /> Examens planifiés
            </CardTitle>
            <Link to="/exams" className="text-xs text-primary hover:underline flex items-center gap-1">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {examsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun examen planifié</p>
            ) : (
              <div className="space-y-3">
                {examsList.slice(0, 5).map((e: any) => (
                  <Link
                    key={e.id}
                    to={`/exams/${e.id}`}
                    className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded"
                  >
                    <div>
                      <p className="font-medium text-sm">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.startDate)}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {e.type}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition élèves */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" /> Répartition des élèves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barres */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Garçons</span>
                  <span className="font-semibold">{stats?.genderSplit.boys || 0}</span>
                </div>
                <div className="h-2 bg-blue-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${stats?.studentsCount ? ((stats.genderSplit.boys / stats.studentsCount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Filles</span>
                  <span className="font-semibold">{stats?.genderSplit.girls || 0}</span>
                </div>
                <div className="h-2 bg-pink-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-pink-500"
                    style={{
                      width: `${stats?.studentsCount ? ((stats.genderSplit.girls / stats.studentsCount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-bold">{stats?.studentsCount || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
