import { useState, useEffect } from "react";
import { X, Loader2, Sparkles, AlertCircle, CheckCircle2, Building2, Layers, School } from "lucide-react";
import {
  Button, Label, Card, CardContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePreviewAutoInvoiceBulk,
  useAutoInvoiceBulk,
} from "@/hooks/finance";
import { useAcademicYearsList } from "@/hooks/academic-years";
import { useLevels } from "@/hooks/levels";
import { useClasses } from "@/hooks/classes";

type Scope = "school" | "level" | "class";

interface Props {
  onClose: () => void;
}

export function BulkInvoiceModal({ onClose }: Props) {
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>("school");
  const [levelId, setLevelId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [result, setResult] = useState<{
    total: number; created: number; skipped: number; failed: number;
  } | null>(null);

  // Donnees de reference
  const { data: years } = useAcademicYearsList();
  const activeYear = years?.find((y: any) => y.status === "ACTIVE");
  const { data: levels } = useLevels();
  const { data: classesData } = useClasses();

  // Hooks bulk
  const preview = usePreviewAutoInvoiceBulk();
  const run = useAutoInvoiceBulk();

  // Filtre actif (construit dynamiquement)
  const filter = {
    academicYearId: activeYear?.id || "",
    ...(scope === "level" && levelId ? { levelId } : {}),
    ...(scope === "class" && classId ? { classId } : {}),
  };

  // Rafraichir l'apercu quand le filtre change
  useEffect(() => {
    if (activeYear?.id && (scope === "school" || levelId || classId)) {
      preview.mutate(filter);
    }
  }, [scope, levelId, classId, activeYear?.id]);

  const canSubmit =
    !!activeYear?.id &&
    !run.isPending &&
    preview.data &&
    preview.data.toCreate > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const res = await run.mutateAsync(filter);
      setResult({
        total: res.total,
        created: res.created,
        skipped: res.skipped,
        failed: res.failed,
      });
    } catch {
      // toast deja gere
    }
  };

  const reset = () => {
    setResult(null);
    preview.reset();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Facturer en masse</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Generez les factures de plusieurs eleves en un clic
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          {result ? (
            <ResultPanel result={result} onClose={onClose} onReset={reset} />
          ) : (
            <>
              {/* Annee */}
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <span className="text-muted-foreground">Annee scolaire : </span>
                <span className="font-medium">
                  {activeYear ? `${activeYear.label} (en cours)` : "Aucune annee active"}
                </span>
              </div>

              {/* Scope selector */}
              <div className="space-y-2">
                <Label>Perimetre de facturation</Label>
                <div className="grid grid-cols-3 gap-2">
                  <ScopeButton
                    active={scope === "school"}
                    onClick={() => setScope("school")}
                    icon={<Building2 className="h-4 w-4" />}
                    label="Toute l'ecole"
                  />
                  <ScopeButton
                    active={scope === "level"}
                    onClick={() => setScope("level")}
                    icon={<Layers className="h-4 w-4" />}
                    label="Par niveau"
                  />
                  <ScopeButton
                    active={scope === "class"}
                    onClick={() => setScope("class")}
                    icon={<School className="h-4 w-4" />}
                    label="Par classe"
                  />
                </div>
              </div>

              {/* Level select */}
              {scope === "level" && (
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={levelId}
                    onChange={(e) => setLevelId(e.target.value)}
                  >
                    <option value="">-- Selectionner --</option>
                    {(levels || []).map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.cycle === "PREMIER_CYCLE" ? "1er cycle" : "2e cycle"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class select */}
              {scope === "class" && (
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">-- Selectionner --</option>
                    {(classesData || []).map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.level?.name || ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preview */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">Apercu</p>
                  {preview.isPending ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calcul en cours...
                    </div>
                  ) : preview.data ? (
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium text-lg text-primary">
                          {preview.data.toCreate}
                        </span>{" "}
                        eleve(s) seront facture(s)
                      </p>
                      {preview.data.alreadyInvoiced > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {preview.data.alreadyInvoiced} eleve(s) ont deja une facture (ignores)
                        </p>
                      )}
                      {preview.data.toCreate === 0 && (
                        <p className="text-xs text-amber-700">
                          Tous les eleves sont deja factures.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Selectionnez un perimetre pour voir l'apercu.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Warning */}
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  Les montants proviennent de la grille tarifaire du niveau de chaque eleve.
                  Les eleves deja factures sont ignores automatiquement.
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} disabled={run.isPending}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmit}>
                  {run.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Facturation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Facturer {preview.data?.toCreate || 0} eleve(s)
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SCOPE BUTTON
// ============================================================

function ScopeButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-md border p-3 text-xs transition-all",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "hover:bg-muted/50",
      )}
    >
      <div className={cn("h-8 w-8 rounded-md flex items-center justify-center", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

// ============================================================
// RESULT PANEL
// ============================================================

function ResultPanel({
  result, onClose, onReset,
}: {
  result: { total: number; created: number; skipped: number; failed: number };
  onClose: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-3 py-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Facturation terminee</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Creees" value={result.created} color="green" />
        <StatBox label="Ignorees" value={result.skipped} color="muted" />
        <StatBox label="Erreurs" value={result.failed} color="red" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onReset}>
          Nouvelle facturation
        </Button>
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
}

function StatBox({
  label, value, color,
}: {
  label: string;
  value: number;
  color: "green" | "muted" | "red";
}) {
  const colorCls = {
    green: "bg-green-50 text-green-700 border-green-200",
    muted: "bg-muted text-muted-foreground border-border",
    red: "bg-red-50 text-red-700 border-red-200",
  }[color];

  return (
    <div className={cn("rounded-md border p-3 text-center", colorCls)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
