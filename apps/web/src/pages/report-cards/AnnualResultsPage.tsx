import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Printer, CheckCheck, AlertCircle } from "lucide-react";
import { Button, Card, CardContent, Label } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useClasses, useLevels } from "@/hooks/classes";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/axios";
import { annualResultsApi, type AnnualDecision } from "@/api/annual-results";

const DECISION: Record<AnnualDecision, { label: string; cls: string }> = {
  ADMIS: { label: "Admis", cls: "bg-green-500/10 text-green-700" },
  REDOUBLE: { label: "Redouble", cls: "bg-red-500/10 text-red-700" },
  A_DETERMINER: { label: "A determiner", cls: "bg-gray-500/10 text-gray-600" },
};

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  body * { visibility: hidden; }
  #annual-results, #annual-results * { visibility: visible; }
  #annual-results { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
}
`;

export function AnnualResultsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { data: classes } = useClasses();
  const { data: levels } = useLevels();

  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [includeDraft, setIncludeDraft] = useState(false);

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return data.data || data;
    },
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (academicYears && !academicYearId) {
      const current = academicYears.find((y: any) => y.isCurrent) || academicYears[0];
      if (current) setAcademicYearId(current.id);
    }
  }, [academicYears, academicYearId]);

  const sortedClasses = useMemo(() => {
    if (!classes || !levels) return [];
    return [...classes].sort((a, b) => {
      const la = levels.find((l) => l.id === a.levelId)?.orderIndex ?? 999;
      const lb = levels.find((l) => l.id === b.levelId)?.orderIndex ?? 999;
      if (la !== lb) return la - lb;
      return a.code.localeCompare(b.code);
    });
  }, [classes, levels]);

  const key = ["annual-results", classId, academicYearId, includeDraft];
  const { data, isLoading, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => annualResultsApi.get(classId, academicYearId, includeDraft),
    enabled: !!classId && !!academicYearId,
  });

  const applyMutation = useMutation({
    mutationFn: () => annualResultsApi.apply(classId, academicYearId),
    onSuccess: (res) => {
      toast.success(
        `Passage enregistré pour ${res.applied} eleve(s)` +
          (res.skipped ? ` (${res.skipped} ignore(s) : année incomplete)` : ""),
      );
      queryClient.invalidateQueries({ queryKey: ["annual-results"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleApply = () => {
    if (
      window.confirm(
        "Enregistrer le passage en classe superieure pour les élèves dont toutes les periodes sont calculees ?",
      )
    ) {
      applyMutation.mutate();
    }
  };

  const periodLabel = data?.periodKind === "MOIS" ? "mois" : "trimestres";

  return (
    <div className="space-y-4 p-6">
      <style>{PRINT_CSS}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Résultats annuels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            1er cycle : moyenne des compositions mensuelles, sur 10. 2eme cycle : moyenne des trimestres avec
            coefficients, sur 20.
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission("report_card:update") && (
            <Button
              variant="outline"
              onClick={handleApply}
              disabled={!data || applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Enregistrer le passage
            </Button>
          )}
          <Button onClick={() => window.print()} disabled={!data}>
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label>Année scolaire</Label>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">-- Selectionner --</option>
            {academicYears?.map((y: any) => (
              <option key={y.id} value={y.id}>
                {y.label} {y.isCurrent ? "(en cours)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Classe</Label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">-- Choisir --</option>
            {sortedClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={includeDraft}
            onChange={(e) => setIncludeDraft(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Inclure les bulletins en brouillon
        </label>
      </div>

      {!classId ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Choisissez une classe.</p>
      ) : isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : isError || !data ? (
        <div className="flex h-40 items-center justify-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error ? getErrorMessage(error) : "Chargement impossible"}
        </div>
      ) : (
        <Card id="annual-results">
          <CardContent className="p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {data.class.name} · resultats annuels
                </h2>
                <p className="text-xs text-muted-foreground">
                  Bareme sur {data.scale} · seuil d'admission {data.admisThreshold} · {data.periods.length}{" "}
                  {periodLabel} pris en compte
                </p>
              </div>
              <div className="text-sm">
                {data.stats.admis} admis · {data.stats.passe} limite · {data.stats.redouble} redoublent
                {data.stats.classAverage !== null && ` · moyenne de classe ${data.stats.classAverage}/${data.scale}`}
              </div>
            </div>

            {data.periods.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune periode ({periodLabel}) pour cette année : creez-les depuis « Generer les bulletins ».
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr className="text-left text-xs font-medium uppercase text-muted-foreground">
                      <th className="px-2 py-2">Rang</th>
                      <th className="px-2 py-2">Élève</th>
                      {data.periods.map((p) => (
                        <th key={p.id} className="px-2 py-2 text-center">
                          {p.name.replace("Composition mensuelle - ", "")}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center">Moyenne annuelle</th>
                      <th className="px-2 py-2">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.student.id} className="border-b last:border-0">
                        <td className="px-2 py-2 font-mono">{r.rank ?? "—"}</td>
                        <td className="px-2 py-2">
                          <div className="font-medium">
                            {r.student.lastName.toUpperCase()} {r.student.firstName}
                          </div>
                          <div className="text-xs text-muted-foreground">{r.student.matricule}</div>
                        </td>
                        {r.periods.map((p) => (
                          <td key={p.termId} className="px-2 py-2 text-center font-mono text-xs">
                            {p.average !== null ? p.average.toFixed(2) : "—"}
                          </td>
                        ))}
                        <td className="px-2 py-2 text-center">
                          {r.annualAverage !== null ? (
                            <span className="font-mono font-bold">
                              {r.annualAverage.toFixed(2)}
                              <span className="text-xs font-normal text-muted-foreground"> /{data.scale}</span>
                            </span>
                          ) : (
                            "—"
                          )}
                          {!r.complete && r.annualAverage !== null && (
                            <div className="text-[10px] text-orange-600">
                              {r.periodsCount}/{data.periods.length} periodes
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${DECISION[r.decision].cls}`}
                          >
                            {DECISION[r.decision].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
