import { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Send,
  Calendar,
  School,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePublishClassReports, useReportCards } from "@/hooks/report-cards";
import { useClasses, useLevels } from "@/hooks/classes";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

interface Props {
  onClose: () => void;
}

export function PublishClassModal({ onClose }: Props) {
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");

  const publishMutation = usePublishClassReports();
  const { data: classes } = useClasses();
  const { data: levels } = useLevels();

  const { data: terms } = useQuery({
    queryKey: ["terms", "list"],
    queryFn: async () => {
      const { data } = await api.get("/terms");
      return data.data || data;
    },
    staleTime: 10 * 60_000,
  });

  // Trimestre courant par defaut
  useEffect(() => {
    if (terms && !termId) {
      const now = new Date();
      const currentTerm = terms.find((t: any) => {
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);
        return now >= start && now <= end;
      });
      setTermId(currentTerm?.id || terms[0]?.id || "");
    }
  }, [terms, termId]);

  // Charger les bulletins pour la classe/trimestre selectionne
  const { data: reports } = useReportCards(
    classId && termId ? { classId, termId } : {},
  );

  const reportList = useMemo(() => {
    if (!reports) return [];
    return Array.isArray(reports) ? reports : (reports as any).data || [];
  }, [reports]);

  // Compter par statut
  const counts = useMemo(() => {
    const c = { DRAFT: 0, VALIDATED: 0, PUBLISHED: 0, total: reportList.length };
    reportList.forEach((r: any) => {
      if (r.status === "DRAFT") c.DRAFT++;
      else if (r.status === "VALIDATED") c.VALIDATED++;
      else if (r.status === "PUBLISHED") c.PUBLISHED++;
    });
    return c;
  }, [reportList]);

  // Classes triees
  const sortedClasses = useMemo(() => {
    if (!classes || !levels) return [];
    return [...classes].sort((a, b) => {
      const la = levels.find((l) => l.id === a.levelId)?.orderIndex ?? 999;
      const lb = levels.find((l) => l.id === b.levelId)?.orderIndex ?? 999;
      if (la !== lb) return la - lb;
      return a.code.localeCompare(b.code);
    });
  }, [classes, levels]);

    // Cycle de la classe selectionnee + filtrage des periodes selon le cycle
  const selectedClass = useMemo(
    () => classes?.find((c) => c.id === classId),
    [classes, classId],
  );
  const selectedCycle = useMemo(
    () => levels?.find((l) => l.id === selectedClass?.levelId)?.cycle,
    [levels, selectedClass],
  );

  const filteredTerms = useMemo(() => {
    if (!terms) return [];
    // 1er cycle -> MOIS (compositions mensuelles)
    // 2e cycle + lycee -> TRIMESTRE (ou SEMESTRE si configure)
    if (selectedCycle === "PREMIER_CYCLE") {
      return terms.filter((t: any) => t.type === "MOIS");
    }
    if (selectedCycle) {
      return terms.filter((t: any) => t.type === "TRIMESTRE" || t.type === "SEMESTRE");
    }
    return terms;
  }, [terms, selectedCycle]);

  const formValid = termId && classId && counts.VALIDATED > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    try {
      await publishMutation.mutateAsync({ classId, termId });
      onClose();
    } catch {
      // erreur geree par le hook
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Publier une classe</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Publie en une seule action tous les bulletins validÃ©s
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={publishMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* CORPS */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* PERIODE (Trimestre ou Composition mensuelle selon le cycle) */}
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {selectedCycle === "PREMIER_CYCLE"
                  ? "Composition mensuelle"
                  : "Periode"}
              </Label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">-- Selectionner --</option>
                {filteredTerms.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type === "MOIS" ? "mensuel" : t.type.toLowerCase()})
                  </option>
                ))}
              </select>
              {selectedCycle && filteredTerms.length === 0 && (
                <p className="mt-1 text-xs text-orange-600">
                  {selectedCycle === "PREMIER_CYCLE"
                    ? "Aucune composition mensuelle pour cette annee. Creez-les depuis Parametres."
                    : "Aucune periode (trimestre/semestre) pour cette annee."}
                </p>
              )}
            </div>

            {/* CLASSE */}
            <div>
              <Label className="flex items-center gap-2">
                <School className="h-3.5 w-3.5" />
                Classe
              </Label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">-- SÃ©lectionner --</option>
                {sortedClasses.map((c) => {
                  const level = levels?.find((l) => l.id === c.levelId);
                  const emoji = level?.cycle === "PREMIER_CYCLE" ? "ðŸ“—" : "ðŸ“˜";
                  return (
                    <option key={c.id} value={c.id}>
                      {emoji} {c.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* ETAT DE PREPARATION */}
            {classId && termId && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Ã‰tat de prÃ©paration
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Brouillons :</span>
                    <span className="font-mono font-medium">{counts.DRAFT}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-medium">
                      ValidÃ©s :
                    </span>
                    <span className="font-mono font-bold text-green-600">
                      {counts.VALIDATED}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">PubliÃ©s :</span>
                    <span className="font-mono font-medium">
                      {counts.PUBLISHED}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total :</span>
                    <span className="font-mono font-medium">{counts.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* AVERTISSEMENTS */}
            {classId && termId && counts.VALIDATED === 0 && counts.total > 0 && (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded p-2.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Aucun bulletin <strong>validÃ©</strong> Ã  publier. Validez
                  d'abord les bulletins en brouillon.
                </span>
              </div>
            )}

            {classId && termId && counts.total === 0 && (
              <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-2.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Aucun bulletin gÃ©nÃ©rÃ© pour cette classe/trimestre.
                  GÃ©nÃ©rez-les d'abord.
                </span>
              </div>
            )}

            {counts.VALIDATED > 0 && (
              <div className="flex items-start gap-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded p-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>{counts.VALIDATED}</strong> bulletin(s) validÃ©(s)
                  seront publiÃ©s. Les brouillons seront ignorÃ©s.
                </span>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={publishMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!formValid || publishMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publier ({counts.VALIDATED})
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
