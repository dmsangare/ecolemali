import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { TrendingUp, School, Users } from "lucide-react";
import { formatFCFA } from "@/types/finance";

// Palette de couleurs distinctes (teal, orange, violet, vert, rouge, cyan)
const CHART_COLORS = [
  "#0e7490", // sis-brand
  "#ea580c", // orange
  "#7c3aed", // violet
  "#059669", // vert
  "#dc2626", // rouge
  "#0891b2", // cyan
];

// ============================================================
// 1. Évolution des recettes par mois (BarChart)
// ============================================================
export function MonthlyRevenueChart({
  data,
  isLoading,
}: {
  data: Array<{ month: string; revenue: number; count: number }>;
  isLoading?: boolean;
}) {
  // Formater le mois en "Sep 2026", "Oct 2026"
  const formatted = data.map((d) => {
    const [year, month] = d.month.split("-");
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthLabel = monthDate.toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    });
    return {
      ...d,
      monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    };
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sis-brand" />
            Évolution des recettes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Chargement…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (formatted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sis-brand" />
            Évolution des recettes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Aucun paiement enregistré pour le moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-sis-lg border-sis-neutral-200 shadow-sis-sm dark:border-sis-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sis-brand" />
          Évolution des recettes
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Revenus mensuels sur l'année scolaire en cours
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              tickFormatter={(v) =>
                v >= 1000000
                  ? `${(v / 1000000).toFixed(1)}M`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}K`
                    : v
              }
            />
            <Tooltip
              formatter={(value: number) => [formatFCFA(value), "Recettes"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="revenue" fill="#0e7490" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 2. Comparaison effectifs par classe (BarChart horizontal)
// ============================================================
export function ClassComparisonChart({
  data,
  isLoading,
}: {
  data: Array<{ className: string; studentCount: number; levelName?: string }>;
  isLoading?: boolean;
}) {
  // Trier par effectif décroissant et prendre le top 8
  const sorted = [...data]
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 8);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <School className="h-4 w-4 text-sis-brand" />
            Effectifs par classe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Chargement…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <School className="h-4 w-4 text-sis-brand" />
            Effectifs par classe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Aucune classe enregistrée.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-sis-lg border-sis-neutral-200 shadow-sis-sm dark:border-sis-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <School className="h-4 w-4 text-sis-brand" />
          Effectifs par classe
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Top 8 des classes les plus peuplées
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis
              type="category"
              dataKey="className"
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [`${value} élèves`, "Effectif"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="studentCount" radius={[0, 6, 6, 0]}>
              {sorted.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 3. Répartition garçons/filles (PieChart / Anneau)
// ============================================================
export function StudentsGenderChart({
  boys,
  girls,
  isLoading,
}: {
  boys: number;
  girls: number;
  isLoading?: boolean;
}) {
  const total = boys + girls;
  const chartData = [
    { name: "Garçons", value: boys },
    { name: "Filles", value: girls },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-sis-brand" />
            Répartition par genre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            Chargement…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-sis-brand" />
            Répartition par genre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            Aucun élève enregistré.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-sis-lg border-sis-neutral-200 shadow-sis-sm dark:border-sis-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-sis-brand" />
          Répartition par genre
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {total} élève(s) au total
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "#0e7490" : "#ea580c"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} élèves`, ""]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}