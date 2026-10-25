import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Users } from "lucide-react";
const COLORS = [
  "#0e7490", // Teal (Bleu-vert) — Garçons
  "#ea580c", // Orange vif — Filles (On échange les positions pour que les 2 premières soient très distinctes)
  "#7c3aed", // Violet
  "#059669", // Vert
  "#dc2626", // Rouge
];

export function AdminGenderDistribution({
  boys,
  girls,
}: {
  boys: number;
  girls: number;
}) {
  const chartData = [
    { name: "Garçons", value: boys },
    { name: "Filles", value: girls },
  ].filter((d) => d.value > 0);

  const total = boys + girls;

  if (total === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-sis-brand" />
            Répartition des élèves
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            Aucun élève enregistré
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-sis-brand" />
          Répartition des élèves
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} élèves`, ""]}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}