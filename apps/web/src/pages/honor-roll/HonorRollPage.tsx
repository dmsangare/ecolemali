import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Printer, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/hooks/school/useSchool";
import { useTopStudents, useHonorRoll } from "@/hooks/dashboard";
import { dashboardApi, type TopStudentEntry, type HonorRollClassEntry } from "@/api/dashboard";

const CYCLES: { key: "PREMIER_CYCLE" | "DEUXIEME_CYCLE" | "LYCEE"; label: string }[] = [
  { key: "PREMIER_CYCLE", label: "1er cycle (1ere - 6eme annee)" },
  { key: "DEUXIEME_CYCLE", label: "2eme cycle (7eme - 9eme annee)" },
  { key: "LYCEE", label: "Lycee (10eme - Terminale)" },
];

const RANK_STYLE: Record<number, { label: string; color: string; bg: string; height: number }> = {
  1: { label: "1er", color: "#b8860b", bg: "#fff6d1", height: 190 },
  2: { label: "2e", color: "#6b7280", bg: "#f1f2f4", height: 160 },
  3: { label: "3e", color: "#b45f1d", bg: "#fdeadb", height: 140 },
};

// Impression : seule la feuille du tableau d'honneur est imprimee, en A4 paysage
const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  body * { visibility: hidden; }
  #honor-roll, #honor-roll * { visibility: visible; }
  #honor-roll {
    position: absolute; left: 0; top: 0; width: 100%;
    border: none !important; box-shadow: none !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}
`;

function PodiumColumn({ entry }: { entry: TopStudentEntry }) {
  const style = RANK_STYLE[entry.rank] ?? RANK_STYLE[3];
  return (
    <div
      className="flex w-56 flex-col items-center justify-between rounded-lg border-2 px-3 pb-3 pt-4 text-center"
      style={{ minHeight: style.height, borderColor: style.color, backgroundColor: style.bg }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: style.color }}
      >
        {style.label}
      </div>
      <div className="mt-2 min-w-0">
        <p className="text-sm font-bold leading-tight" style={{ color: style.color }}>
          {entry.student.lastName.toUpperCase()}
        </p>
        <p className="text-sm font-medium leading-tight">{entry.student.firstName}</p>
        <p className="mt-1 text-xs text-gray-600">{entry.class.name}</p>
      </div>
      <p className="mt-2 font-mono text-lg font-bold" style={{ color: style.color }}>
        {entry.average.toFixed(2)}
        <span className="text-xs font-normal text-gray-500"> / {entry.scale}</span>
      </p>
    </div>
  );
}

function CycleSection({ label, entries, period }: { label: string; entries: TopStudentEntry[]; period?: string }) {
  if (entries.length === 0) return null;
  // Disposition de podium : 2e a gauche, 1er au centre, 3e a droite
  const byRank = (r: number) => entries.find((e) => e.rank === r);
  const ordered = [byRank(2), byRank(1), byRank(3)].filter(Boolean) as TopStudentEntry[];
  return (
    <section className="mt-6" style={{ breakInside: "avoid" }}>
      <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        {label}
        {period && <span className="block text-xs font-normal normal-case text-gray-500">{period}</span>}
      </h3>
      <div className="flex items-end justify-center gap-4">
        {ordered.map((entry) => (
          <PodiumColumn key={`${entry.rank}-${entry.student.id}`} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function ClassRankingSection({
  label,
  entries,
  period,
}: {
  label: string;
  entries: HonorRollClassEntry[];
  period?: string;
}) {
  if (entries.length === 0) return null;

  const scale = entries[0]?.scale ?? 20;

  return (
    <section className="mt-6" style={{ breakInside: "avoid" }}>
      <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        {label} — Classement des classes
        {period && <span className="block text-xs font-normal normal-case text-gray-500">{period}</span>}
      </h3>
      <table className="mx-auto w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="px-3 py-2 text-left font-semibold w-16">Rang</th>
            <th className="px-3 py-2 text-left font-semibold">Classe</th>
            <th className="px-3 py-2 text-left font-semibold">Niveau</th>
            <th className="px-3 py-2 text-right font-semibold">Moyenne</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const previous = entries[i - 1];
            const isTie = previous && previous.rank === e.rank;
            return (
              <tr
                key={e.classId}
                className={isTie ? "border-b border-dashed border-gray-200" : "border-b border-gray-200"}
              >
                <td className="px-3 py-2 font-bold" style={{ color: e.rank === 1 ? "#b8860b" : undefined }}>
                  {e.rank === 1 ? "1er" : `${e.rank}e`}
                </td>
                <td className="px-3 py-2 font-medium">{e.className}</td>
                <td className="px-3 py-2 text-gray-600">{e.levelName ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {e.average.toFixed(2)}
                  <span className="text-xs text-gray-500"> / {scale}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function HonorRollPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { data: school } = useSchool();
  const { data, isLoading } = useTopStudents();
  const { data: honorRoll } = useHonorRoll();

  const recompute = useMutation({
    mutationFn: () => dashboardApi.recomputeTopStudents(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "top-students"] });
      toast.success("Tableau d'honneur recalcule");
    },
    onError: () => toast.error("Impossible de recalculer le tableau d'honneur"),
  });

  const podiums = data?.podiums;
  const hasAny =
    !!podiums && (podiums.PREMIER_CYCLE.length > 0 || podiums.DEUXIEME_CYCLE.length > 0 || podiums.LYCEE.length > 0);

  return (
    <div className="space-y-4 p-6">
      <style>{PRINT_CSS}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau d'honneur</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les trois meilleurs eleves de chaque cycle, d'apres les bulletins publies.
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission("report_card:create") && (
            <Button variant="outline" onClick={() => recompute.mutate()} disabled={recompute.isPending}>
              {recompute.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Recalculer
            </Button>
          )}
          <Button onClick={() => window.print()} disabled={!hasAny}>
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div id="honor-roll" className="mx-auto max-w-5xl rounded-xl border bg-white p-8 shadow-sm">
          <header className="text-center">
            {school?.logoUrl && (
              <img src={school.logoUrl} alt="" className="mx-auto mb-2 h-16 w-16 object-contain" />
            )}
            <p className="text-lg font-bold uppercase tracking-wide">{school?.name || "Etablissement"}</p>
            {school?.motto && <p className="text-xs italic text-gray-600">{school.motto}</p>}
            <div className="mx-auto my-4 h-px w-40 bg-gray-300" />
            <div className="flex items-center justify-center gap-2" style={{ color: "#b8860b" }}>
              <Trophy className="h-7 w-7" />
              <h2 className="text-3xl font-extrabold uppercase tracking-widest">Tableau d'honneur</h2>
              <Trophy className="h-7 w-7" />
            </div>
          </header>

          {hasAny && podiums ? (
            <>
              {CYCLES.map((c) => (
                <CycleSection key={c.key} label={c.label} entries={podiums[c.key]} period={data?.periods?.[c.key]?.name} />
              ))}

              {honorRoll?.podiums && CYCLES.map((c) => (
                <ClassRankingSection
                  key={`classes-${c.key}`}
                  label={c.label}
                  entries={honorRoll.podiums[c.key]}
                  period={honorRoll.term?.name}
                />
              ))}
              <footer className="mt-10 flex items-end justify-between text-sm text-gray-700">
                <p className="max-w-md italic">
                  Felicitations a nos meilleurs eleves et a leurs familles. Que cet exemple en inspire beaucoup d'autres.
                </p>
                <div className="text-center">
                  <p>La Direction</p>
                  {school?.directorName && <p className="mt-6 font-medium">{school.directorName}</p>}
                </div>
              </footer>
            </>
          ) : (
            <p className="py-16 text-center text-sm text-gray-500">
              Le tableau d'honneur apparaitra apres la publication des bulletins du trimestre en cours.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
