import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const COLORS = [
  "#0e7490", // Teal
  "#ea580c", // Orange
  "#7c3aed", // Violet
  "#059669", // Vert
  "#dc2626", // Rouge
  "#0891b2", // Cyan
];

export function TeacherClassDistribution({ classes }: { classes: any[] }) {
  // On prépare les données réelles pour le graphique
  const chartData = classes
    .filter((c) => c.studentCount > 0)
    .map((c) => ({
      name: c.name,
      value: c.studentCount,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="flex h-full flex-col justify-center">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Aucun élève réparti dans vos classes pour le moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Répartition de mes élèves
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} élèves`, "Effectif"]}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}