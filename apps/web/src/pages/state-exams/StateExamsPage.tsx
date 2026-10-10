import { useState, useMemo } from "react";
import {
  GraduationCap,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Users,
  Info,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAcademicYearsList } from "@/hooks/academic-years";
import {
  useStateExamLevels,
  useStateExamCandidates,
  useSaveStateExamResults,
} from "@/hooks/state-exams";
import type {
  StateExamLevel,
  StateExamCandidate,
  StateExamResult,
} from "@/api/state-exams";
import type { AcademicYear } from "@/api/academic-years";

const RESULT_STYLE: Record<
  StateExamResult,
  { label: string; cls: string }
> = {
  ADMIS: { label: "Admis", cls: "bg-green-500/10 text-green-700 border-green-300" },
  REFUSE: { label: "Refusé", cls: "bg-red-500/10 text-red-700 border-red-300" },
  ABSENT: { label: "Absent", cls: "bg-gray-500/10 text-gray-700 border-gray-300" },
  EN_ATTENTE: {
    label: "En attente",
    cls: "bg-amber-500/10 text-amber-700 border-amber-300",
  },
};

export function StateExamsPage() {
  const { data: years } = useAcademicYearsList();
  const { data: levels, isLoading: levelsLoading } = useStateExamLevels();

  // Selection
  const [yearId, setYearId] = useState<string>("");
  const [levelId, setLevelId] = useState<string>("");

  // Auto-selection de l'annee courante
  const currentYear = useMemo(
    () => years?.find((y: AcademicYear) => y.isCurrent) || years?.[0],
    [years],
  );
  if (!yearId && currentYear) {
    // useState + side effect -> on peut juste l'utiliser comme valeur par defaut
  }

  // Modifications locales (avant sauvegarde)
  const [edits, setEdits] = useState<Record<string, StateExamResult>>({});
  const [scores, setScores] = useState<Record<string, number | null>>({});

  const effectiveYearId = yearId || currentYear?.id || "";
  const { data: candidates, isLoading: candidatesLoading } =
    useStateExamCandidates(levelId, effectiveYearId);

  const saveMutation = useSaveStateExamResults();

  const handleResultChange = (studentId: string, result: StateExamResult) => {
    setEdits((prev) => ({ ...prev, [studentId]: result }));
  };

  const handleScoreChange = (studentId: string, score: string) => {
    const n = score === "" ? null : parseFloat(score);
    setScores((prev) => ({ ...prev, [studentId]: isNaN(n as any) ? null : n }));
  };

  const handleSave = async () => {
    if (!candidates || candidates.length === 0) return;

    const results = candidates.map((c) => ({
      studentId: c.studentId,
      result: edits[c.studentId] ?? c.result,
      score: scores[c.studentId] ?? c.score ?? undefined,
    }));

    await saveMutation.mutateAsync({
      levelId,
      academicYearId: effectiveYearId,
      results,
    });
    setEdits({});
    setScores({});
  };

  const hasEdits =
    Object.keys(edits).length > 0 || Object.keys(scores).length > 0;

  const stats = useMemo(() => {
    if (!candidates) return { admis: 0, refuse: 0, absent: 0, attente: 0 };
    const s = { admis: 0, refuse: 0, absent: 0, attente: 0 };
    for (const c of candidates) {
      const r = edits[c.studentId] ?? c.result;
      if (r === "ADMIS") s.admis++;
      else if (r === "REFUSE") s.refuse++;
      else if (r === "ABSENT") s.absent++;
      else s.attente++;
    }
    return s;
  }, [candidates, edits]);

  if (levelsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Examens d'État
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Saisissez les résultats du DEF (9ème année) et du BAC (Terminale).
        </p>
      </div>

      {/* INFO */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Les résultats saisis ici sont utilisés par le wizard de{" "}
            <strong>Passage à l'année suivante</strong> pour décider
            automatiquement : Admis → orientation, Refusé → redoublement.
          </p>
        </CardContent>
      </Card>

      {/* SELECTION */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">Année scolaire</label>
            <select
              value={effectiveYearId}
              onChange={(e) => {
                setYearId(e.target.value);
                setLevelId("");
                setEdits({});
                setScores({});
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {years?.map((y: AcademicYear) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                  {y.isCurrent ? " (courante)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">
              Niveau d'examen
            </label>
            <select
              value={levelId}
              onChange={(e) => {
                setLevelId(e.target.value);
                setEdits({});
                setScores({});
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">-- Choisir un niveau --</option>
              {levels?.map((l: StateExamLevel) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.stateExamType}) — {l.studentsCount} élève(s)
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* CONTENU */}
      {!levelId ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Sélectionnez un niveau pour saisir les résultats.
          </CardContent>
        </Card>
      ) : candidatesLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !candidates || candidates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Aucun élève inscrit à ce niveau pour cette année.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* STATS */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {candidates.length} élève(s)
                </span>
                <span className="text-green-700 font-medium">
                  {stats.admis} admis
                </span>
                <span className="text-red-700 font-medium">
                  {stats.refuse} refusé(s)
                </span>
                <span className="text-gray-700 font-medium">
                  {stats.absent} absent(s)
                </span>
                <span className="text-amber-700 font-medium">
                  {stats.attente} en attente
                </span>
              </div>
            </CardContent>
          </Card>

          {/* TABLEAU */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="text-left p-3 font-medium">Élève</th>
                      <th className="text-left p-3 font-medium">Classe</th>
                      <th className="text-left p-3 font-medium w-52">Résultat</th>
                      <th className="text-left p-3 font-medium w-32">Note /20</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => {
                      const current = edits[c.studentId] ?? c.result;
                      const currentScore = scores[c.studentId] ?? c.score;
                      const style = RESULT_STYLE[current];
                      return (
                        <tr key={c.studentId} className="border-b last:border-0">
                          <td className="p-3">
                            <div className="font-medium">
                              {c.lastName.toUpperCase()} {c.firstName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {c.matricule}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {c.className}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-block px-2 py-0.5 rounded text-xs font-medium border",
                                  style.cls,
                                )}
                              >
                                {style.label}
                              </span>
                              <select
                                value={current}
                                onChange={(e) =>
                                  handleResultChange(
                                    c.studentId,
                                    e.target.value as StateExamResult,
                                  )
                                }
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              >
                                <option value="ADMIS">Admis</option>
                                <option value="REFUSE">Refusé</option>
                                <option value="ABSENT">Absent</option>
                                <option value="EN_ATTENTE">En attente</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              max={20}
                              step={0.25}
                              value={currentScore ?? ""}
                              onChange={(e) =>
                                handleScoreChange(c.studentId, e.target.value)
                              }
                              className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm"
                              placeholder="—"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasEdits || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer les résultats
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
