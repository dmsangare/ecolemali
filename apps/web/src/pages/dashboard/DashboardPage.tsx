import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UsersRound,
  School,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { reportsApi } from "@/api/reports";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  variant?: "default" | "success" | "danger";
}

function StatCard({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) {
  const colors = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    danger: "bg-red-500/10 text-red-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${colors[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => reportsApi.getDashboard(),
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
            <p className="text-destructive">
              Erreur lors du chargement des statistiques.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tete */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour, {user?.firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Voici un apercu de votre etablissement
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Eleves"
          value={stats?.studentsCount || 0}
          icon={Users}
          description={`${stats?.genderSplit.boys || 0} garcons, ${stats?.genderSplit.girls || 0} filles`}
        />
        <StatCard
          title="Enseignants"
          value={stats?.teachersCount || 0}
          icon={UsersRound}
          description="Personnel enseignant actif"
        />
        <StatCard
          title="Classes"
          value={stats?.classesCount || 0}
          icon={School}
          description="Classes actives"
        />
        <StatCard
          title="Taux de presence"
          value={`${stats?.attendanceRate || 0}%`}
          icon={CheckCircle2}
          variant="success"
          description="Moyenne generale"
        />
      </div>

      {/* Finances */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Recettes"
          value={formatCurrency(stats?.revenueAmount || 0)}
          icon={TrendingUp}
          variant="success"
          description="Paiements encaisses"
        />
        <StatCard
          title="Impayes"
          value={formatCurrency(stats?.unpaidAmount || 0)}
          icon={TrendingDown}
          variant="danger"
          description="Solde restant du"
        />
        <StatCard
          title="Total facture"
          value={formatCurrency(stats?.totalBilled || 0)}
          icon={Wallet}
          description="Montant total facture"
        />
      </div>

      {/* Bloc info */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue dans SIS-MALI</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Cette interface vous permet de gerer l ensemble de votre etablissement :
            eleves, notes, bulletins, paiements et bien plus.
          </p>
          <p>
            Utilisez le menu lateral pour naviguer entre les differents modules.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
