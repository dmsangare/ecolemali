import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui";

interface GradesDistributionProps {
  values: Record<string, string>;
  maxScore: number;
}

export function GradesDistribution({ values, maxScore }: GradesDistributionProps) {
  // Ramener toutes les notes sur 20
  const gradesOutOf20 = Object.values(values)
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v) && v >= 0 && v <= maxScore)
    .map((v) => (maxScore === 10 ? v * 2 : v));

  const total = gradesOutOf20.length;

  const buckets = [
    { label: "0 - 5", min: 0, max: 5, color: "bg-red-500" },
    { label: "5 - 10", min: 5, max: 10, color: "bg-orange-500" },
    { label: "10 - 15", min: 10, max: 15, color: "bg-blue-500" },
    { label: "15 - 20", min: 15, max: 20.01, color: "bg-green-500" },
  ];

  const counts = buckets.map(
    (b) => gradesOutOf20.filter((v) => v >= b.min && v < b.max).length,
  );

  const maxCount = Math.max(...counts, 1);

  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Saisissez des notes pour voir la distribution
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Distribution des notes (sur 20)</h3>
          <span className="text-xs text-muted-foreground">
            {total} note{total > 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {buckets.map((b, i) => {
            const pct = total > 0 ? (counts[i] / total) * 100 : 0;
            return (
              <div key={b.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-mono font-medium">{counts[i]}</span>
                </div>
                <div className="h-8 bg-muted rounded overflow-hidden relative">
                  <div
                    className={cn("h-full transition-all", b.color)}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
