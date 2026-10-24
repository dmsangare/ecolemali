import { Loader2, Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTopStudents } from "@/hooks/dashboard";
import type { TopStudentEntry } from "@/api/dashboard";

const CYCLE_LABELS: Record<string, string> = {
  PREMIER_CYCLE: "1er Cycle (1ere - 6eme)",
  DEUXIEME_CYCLE: "2eme Cycle (7eme - 9eme)",
  LYCEE: "Lycee (10eme - Terminale)",
};

const RANK_STYLES: Record<
  number,
  { bg: string; text: string; icon: typeof Trophy }
> = {
  1: { bg: "bg-yellow-100 border-yellow-400", text: "text-yellow-700", icon: Trophy },
  2: { bg: "bg-gray-100 border-gray-300", text: "text-gray-700", icon: Medal },
  3: { bg: "bg-orange-100 border-orange-300", text: "text-orange-700", icon: Award },
};

function PodiumCard({
  entries,
  cycle,
}: {
  entries: TopStudentEntry[];
  cycle: string;
}) {
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {CYCLE_LABELS[cycle] || cycle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => {
          const style = RANK_STYLES[entry.rank] || RANK_STYLES[3];
          const Icon = style.icon;
          return (
            <div
              key={`${cycle}-${entry.student.id}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-3",
                style.bg,
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shrink-0",
                  style.text,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold truncate", style.text)}>
                  {entry.student.lastName.toUpperCase()} {entry.student.firstName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.class.name} · {entry.student.matricule}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-lg font-bold font-mono", style.text)}>
                  {entry.average.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  /{entry.scale}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function TopStudentsPodium() {
  const { data, isLoading } = useTopStudents();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const podiums = data?.podiums;
  const hasAny =
    podiums &&
    (podiums.PREMIER_CYCLE.length > 0 ||
      podiums.DEUXIEME_CYCLE.length > 0 ||
      podiums.LYCEE.length > 0);

  if (!hasAny) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Tableau d'honneur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Les meilleurs élèves apparaitront ici apres la publication des
            bulletins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {podiums && podiums.PREMIER_CYCLE.length > 0 && (
        <PodiumCard entries={podiums.PREMIER_CYCLE} cycle="PREMIER_CYCLE" />
      )}
      {podiums && podiums.DEUXIEME_CYCLE.length > 0 && (
        <PodiumCard entries={podiums.DEUXIEME_CYCLE} cycle="DEUXIEME_CYCLE" />
      )}
      {podiums && podiums.LYCEE.length > 0 && (
        <PodiumCard entries={podiums.LYCEE} cycle="LYCEE" />
      )}
    </div>
  );
}
