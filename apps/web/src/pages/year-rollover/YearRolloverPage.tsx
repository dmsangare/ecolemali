import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Calendar,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAcademicYearsList } from "@/hooks/academic-years";
import { useYearRolloverPreview, useYearRolloverExecute } from "@/hooks/year-rollover";
import type {
  PreviewYearRolloverResult,
  PeriodsToClone,
} from "@/api/year-rollover";
import type { AcademicYear } from "@/api/academic-years";

type Step = 1 | 2 | 3 | 4;

const STEPS: Array<{ n: Step; label: string; icon: any }> = [
  { n: 1, label: "Nouvelle annee", icon: Calendar },
  { n: 2, label: "Structure", icon: GraduationCap },
  { n: 3, label: "Eleves", icon: Users },
  { n: 4, label: "Confirmation", icon: CheckCircle2 },
];

/** Genere un libelle "YYYY-YYYY" pour l'annee suivante. */
function suggestNextLabel(currentLabel?: string): string {
  if (currentLabel) {
    const m = currentLabel.match(/^(\d{4})-(\d{4})$/);
    if (m) {
      const y1 = parseInt(m[1], 10) + 1;
      const y2 = parseInt(m[2], 10) + 1;
      return `${y1}-${y2}`;
    }
  }
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

/** Genere les dates proposees (1er oct -> 30 juin). */
function suggestDates(label: string): { start: string; end: string } {
  const m = label.match(/^(\d{4})-\d{4}$/);
  const y = m ? parseInt(m[1], 10) : new Date().getFullYear();
  return { start: `${y}-10-01`, end: `${y + 1}-06-30` };
}

export function YearRolloverPage() {
  // Etat global du wizard
  const [step, setStep] = useState<Step>(1);
  const [previewResult, setPreviewResult] =
    useState<PreviewYearRolloverResult | null>(null);

  // Etape 1 — Configuration
  const [fromYearId, setFromYearId] = useState<string>("");
  const [newLabel, setNewLabel] = useState<string>("");
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newEndDate, setNewEndDate] = useState<string>("");
  const [periodsToClone, setPeriodsToClone] = useState<PeriodsToClone[]>([
    "TRIMESTRE",
    "MOIS",
  ]);
  const [feeIncreasePercent, setFeeIncreasePercent] = useState<number>(0);

  // Etape 3 — Overrides manuels des decisions
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  // Etape 2 — Structure
  const [cloneClasses, setCloneClasses] = useState(true);
  const [cloneTeacherAssignments, setCloneTeacherAssignments] = useState(true);
  const [cloneFeeStructures, setCloneFeeStructures] = useState(true);
  const [cloneTimetable, setCloneTimetable] = useState(false);

  // Charge les annees scolaires
  const { data: years, isLoading: yearsLoading } = useAcademicYearsList();

  // Auto-selectionne l'annee courante au chargement
  useEffect(() => {
    if (!fromYearId && years && years.length > 0) {
      const current = years.find((y: AcademicYear) => y.isCurrent);
      const target = current || years[0];
      setFromYearId(target.id);
      const label = suggestNextLabel(target.label);
      setNewLabel(label);
      const dates = suggestDates(label);
      setNewStartDate(dates.start);
      setNewEndDate(dates.end);
    }
  }, [years, fromYearId]);

  // Sync des dates quand le libelle change manuellement
  useEffect(() => {
    if (newLabel && /^\d{4}-\d{4}$/.test(newLabel)) {
      const dates = suggestDates(newLabel);
      setNewStartDate(dates.start);
      setNewEndDate(dates.end);
    }
  }, [newLabel]);

  const previewMutation = useYearRolloverPreview();
  const executeMutation = useYearRolloverExecute();
  const [executeResult, setExecuteResult] = useState<{
    newYearId: string;
    newYearLabel: string;
    periodsCreated: number;
    classesCreated: number;
    feesCreated: number;
    enrollmentsCreated: number;
    skipped: number;
  } | null>(null);

  const sourceYear = useMemo(
    () => years?.find((y: AcademicYear) => y.id === fromYearId),
    [years, fromYearId],
  );

  // ============================================================
  // NAVIGATION
  // ============================================================

  const goNext = async () => {
    if (step === 1) {
      // Validation + Preview
      if (!fromYearId || !newLabel || !newStartDate || !newEndDate) return;
      try {
        const result = await previewMutation.mutateAsync({
          fromYearId,
          newLabel,
          newStartDate,
          newEndDate,
          periodsToClone,
          structureToClone: {
            classes: cloneClasses,
            teacherAssignments: cloneTeacherAssignments,
            feeStructures: cloneFeeStructures,
            timetable: cloneTimetable,
          },
          feeIncreasePercent,
        });
        setPreviewResult(result);
        setStep(2);
      } catch {
        // erreur geree par le hook
      }
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleExecute = async () => {
    if (!previewResult) return;

    const decisions = previewResult.decisions.map((d) => ({
      studentId: d.studentId,
      decision: (overrides[d.studentId] || d.decision) as any,
      targetClassId: d.targetClassId || undefined,
    }));

    try {
      const result = await executeMutation.mutateAsync({
        fromYearId,
        newLabel,
        newStartDate,
        newEndDate,
        periodsToClone,
        structureToClone: {
          classes: cloneClasses,
          teacherAssignments: cloneTeacherAssignments,
          feeStructures: cloneFeeStructures,
          timetable: cloneTimetable,
        },
        feeIncreasePercent,
        decisions,
      });
      setExecuteResult(result);
    } catch {
      // erreur geree par le hook
    }
  };

  const togglePeriod = (p: PeriodsToClone) => {
    setPeriodsToClone((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const setOverride = (studentId: string, decision: string) => {
    setOverrides((prev) => ({ ...prev, [studentId]: decision }));
  };

  const clearOverride = (studentId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (yearsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canGoNext =
    (step === 1 &&
      fromYearId &&
      newLabel.length > 0 &&
      newStartDate &&
      newEndDate &&
      periodsToClone.length > 0) ||
    step === 2 ||
    step === 3;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Passage a l'annee suivante
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Creez l'annee scolaire suivante en recopiant la structure et en
          inscrivant les eleves selon leurs resultats annuels.
        </p>
      </div>

      {/* STEPPER */}
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const active = step === s.n;
          const done = step > s.n;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full shrink-0 transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider font-semibold truncate",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    Etape {s.n}
                  </p>
                  <p className="text-sm font-medium truncate">{s.label}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2",
                    done ? "bg-green-500" : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* CONTENU */}
      {step === 1 && (
        <Step1Config
          years={years || []}
          fromYearId={fromYearId}
          setFromYearId={setFromYearId}
          sourceYear={sourceYear}
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          newStartDate={newStartDate}
          setNewStartDate={setNewStartDate}
          newEndDate={newEndDate}
          setNewEndDate={setNewEndDate}
          periodsToClone={periodsToClone}
          togglePeriod={togglePeriod}
          feeIncreasePercent={feeIncreasePercent}
          setFeeIncreasePercent={setFeeIncreasePercent}
          isLoading={previewMutation.isPending}
        />
      )}

      {step === 2 && previewResult && (
        <Step2Structure
          preview={previewResult}
          cloneClasses={cloneClasses}
          setCloneClasses={setCloneClasses}
          cloneTeacherAssignments={cloneTeacherAssignments}
          setCloneTeacherAssignments={setCloneTeacherAssignments}
          cloneFeeStructures={cloneFeeStructures}
          setCloneFeeStructures={setCloneFeeStructures}
          cloneTimetable={cloneTimetable}
          setCloneTimetable={setCloneTimetable}
        />
      )}

      {step === 3 && previewResult && (
        <Step3Students
          preview={previewResult}
          overrides={overrides}
          setOverride={setOverride}
          clearOverride={clearOverride}
        />
      )}

      {step === 4 && previewResult && (
        <Step4Confirm
          preview={previewResult}
          overrides={overrides}
          onExecute={handleExecute}
          isExecuting={executeMutation.isPending}
          result={executeResult}
        />
      )}

      {/* FOOTER */}
      <div className="flex justify-between items-center pt-2 border-t">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center gap-2">
          {previewMutation.isPending && (
            <span className="text-xs text-muted-foreground">
              Calcul de l'apercu...
            </span>
          )}
          {step < 4 && (
            <Button
              onClick={goNext}
              disabled={!canGoNext || previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Suivant
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ETAPE 1 — CONFIGURATION
// ============================================================

interface Step1Props {
  years: AcademicYear[];
  fromYearId: string;
  setFromYearId: (v: string) => void;
  sourceYear?: AcademicYear;
  newLabel: string;
  setNewLabel: (v: string) => void;
  newStartDate: string;
  setNewStartDate: (v: string) => void;
  newEndDate: string;
  setNewEndDate: (v: string) => void;
  periodsToClone: PeriodsToClone[];
  togglePeriod: (p: PeriodsToClone) => void;
  feeIncreasePercent: number;
  setFeeIncreasePercent: (v: number) => void;
  isLoading: boolean;
}

function Step1Config(p: Step1Props) {
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        {/* INFO */}
        <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/50 p-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            L'annee sera creee en statut <strong>En preparation</strong>. Vous
            l'activerez a la rentree depuis <strong>Annees scolaires</strong>.
          </p>
        </div>

        {/* ANNEE SOURCE */}
        <div>
          <Label htmlFor="fromYear">Annee source *</Label>
          <select
            id="fromYear"
            value={p.fromYearId}
            onChange={(e) => p.setFromYearId(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            disabled={p.isLoading}
          >
            <option value="">-- Choisir --</option>
            {p.years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.isCurrent ? " (courante)" : ""} — {y.status}
              </option>
            ))}
          </select>
        </div>

        {/* LIBELLE NOUVELLE ANNEE */}
        <div>
          <Label htmlFor="newLabel">Libelle de la nouvelle annee *</Label>
          <Input
            id="newLabel"
            value={p.newLabel}
            onChange={(e) => p.setNewLabel(e.target.value)}
            className="mt-1 font-mono"
            placeholder="2027-2028"
            disabled={p.isLoading}
          />
        </div>

        {/* DATES */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="newStart">Debut *</Label>
            <Input
              id="newStart"
              type="date"
              value={p.newStartDate}
              onChange={(e) => p.setNewStartDate(e.target.value)}
              className="mt-1"
              disabled={p.isLoading}
            />
          </div>
          <div>
            <Label htmlFor="newEnd">Fin *</Label>
            <Input
              id="newEnd"
              type="date"
              value={p.newEndDate}
              onChange={(e) => p.setNewEndDate(e.target.value)}
              className="mt-1"
              disabled={p.isLoading}
            />
          </div>
        </div>

        {/* PERIODES A CLONER */}
        <div>
          <Label>Periodes a creer *</Label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
              <input
                type="checkbox"
                checked={p.periodsToClone.includes("TRIMESTRE")}
                onChange={() => p.togglePeriod("TRIMESTRE")}
                className="h-4 w-4"
                disabled={p.isLoading}
              />
              <div>
                <p className="font-medium text-sm">Trimestres</p>
                <p className="text-xs text-muted-foreground">
                  Pour le 2eme cycle et le lycee
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
              <input
                type="checkbox"
                checked={p.periodsToClone.includes("MOIS")}
                onChange={() => p.togglePeriod("MOIS")}
                className="h-4 w-4"
                disabled={p.isLoading}
              />
              <div>
                <p className="font-medium text-sm">Compositions mensuelles</p>
                <p className="text-xs text-muted-foreground">
                  Pour le 1er cycle (1ere - 6eme annee)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* AUGMENTATION TARIFS */}
        <div>
          <Label htmlFor="feeIncrease">
            Augmentation des tarifs (%)
          </Label>
          <Input
            id="feeIncrease"
            type="number"
            min={-100}
            max={100}
            step={1}
            value={p.feeIncreasePercent}
            onChange={(e) =>
              p.setFeeIncreasePercent(parseInt(e.target.value) || 0)
            }
            className="mt-1"
            disabled={p.isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Les tarifs seront recopies avec ce pourcentage en plus (ex: 50000
            FCFA + 5% = 52500 FCFA). Mettre 0 pour recopier a l'identique.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ETAPE 2 — STRUCTURE (placeholder, detail au prochain patch)
// ============================================================

interface Step2Props {
  preview: PreviewYearRolloverResult;
  cloneClasses: boolean;
  setCloneClasses: (v: boolean) => void;
  cloneTeacherAssignments: boolean;
  setCloneTeacherAssignments: (v: boolean) => void;
  cloneFeeStructures: boolean;
  setCloneFeeStructures: (v: boolean) => void;
  cloneTimetable: boolean;
  setCloneTimetable: (v: boolean) => void;
}

function Step2Structure(p: Step2Props) {
  return (
    <div className="space-y-4">
      {/* CASES A COCHER */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <div>
            <h3 className="text-base font-semibold">Que recopier ?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cochez les elements de structure a cloner dans la nouvelle annee.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
            <input
              type="checkbox"
              checked={p.cloneClasses}
              onChange={(e) => p.setCloneClasses(e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">Classes</p>
              <p className="text-xs text-muted-foreground">
                {p.preview.classes.length} classe(s) — recommandé
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
            <input
              type="checkbox"
              checked={p.cloneTeacherAssignments}
              onChange={(e) => p.setCloneTeacherAssignments(e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">Affectations des enseignants</p>
              <p className="text-xs text-muted-foreground">
                Recopier les profs titulaires et affectations
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
            <input
              type="checkbox"
              checked={p.cloneFeeStructures}
              onChange={(e) => p.setCloneFeeStructures(e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">Tarifs</p>
              <p className="text-xs text-muted-foreground">
                {p.preview.feeStructures.length} tarif(s)
                {p.preview.feeIncreasePercent !== 0 && (
                  <> · augmentés de {p.preview.feeIncreasePercent}%</>
                )}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
            <input
              type="checkbox"
              checked={p.cloneTimetable}
              onChange={(e) => p.setCloneTimetable(e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">Emploi du temps</p>
              <p className="text-xs text-muted-foreground">
                Optionnel — peut être refait manuellement
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* APERCU PERIODES */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Periodes à créer ({p.preview.periods.length})
          </h3>
          <div className="space-y-1 text-sm">
            {p.preview.periods.map((period, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b last:border-0"
              >
                <div>
                  <span className="font-medium">{period.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({period.type})
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(period.startDate).toLocaleDateString("fr-FR")} →{" "}
                  {new Date(period.endDate).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* APERCU CLASSES */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Classes ({p.preview.classes.length})
          </h3>
          <div className="space-y-1 text-sm">
            {p.preview.classes.map((cls) => (
              <div
                key={cls.fromClassId}
                className="flex items-center justify-between py-1.5 border-b last:border-0"
              >
                <div>
                  <span className="font-medium">{cls.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {cls.levelName} · {cls.cycle}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {cls.studentsCount} élève(s)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* APERCU TARIFS */}
      {p.preview.feeStructures.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-base font-semibold">
              Tarifs ({p.preview.feeStructures.length})
            </h3>
            {p.preview.feeIncreasePercent !== 0 && (
              <p className="text-xs text-muted-foreground">
                Augmentation appliquée :{" "}
                <strong>+{p.preview.feeIncreasePercent}%</strong>
              </p>
            )}
            <div className="space-y-1 text-sm">
              {p.preview.feeStructures.map((fee) => (
                <div
                  key={fee.fromFeeStructureId}
                  className="flex items-center justify-between py-1.5 border-b last:border-0"
                >
                  <div>
                    <span className="font-medium">{fee.feeTypeName}</span>
                    {fee.levelName && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({fee.levelName})
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-muted-foreground line-through">
                      {fee.oldAmount.toLocaleString("fr-FR")}
                    </span>
                    <span className="mx-1">→</span>
                    <span className="font-semibold text-primary">
                      {fee.newAmount.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const DECISION_LABEL: Record<string, string> = {
  ADMIS: "Admis (niveau supérieur)",
  REDOUBLE: "Redoublant (même classe)",
  QUITTE_ECOLE: "Quitte l'école (dernier niveau)",
  DIPLOME: "Diplômé (sortie)",
  NON_INSCRIT: "Non inscrit",
  EN_ATTENTE_DEF: "En attente DEF",
  EN_ATTENTE_BAC: "En attente BAC",
};

const DECISION_STYLE: Record<string, string> = {
  ADMIS: "bg-green-500/10 text-green-700 border-green-300",
  REDOUBLE: "bg-amber-500/10 text-amber-700 border-amber-300",
  QUITTE_ECOLE: "bg-gray-500/10 text-gray-700 border-gray-300",
  DIPLOME: "bg-blue-500/10 text-blue-700 border-blue-300",
  NON_INSCRIT: "bg-red-500/10 text-red-700 border-red-300",
  EN_ATTENTE_DEF: "bg-purple-500/10 text-purple-700 border-purple-300",
  EN_ATTENTE_BAC: "bg-purple-500/10 text-purple-700 border-purple-300",
};

interface Step3Props {
  preview: PreviewYearRolloverResult;
  overrides: Record<string, string>;
  setOverride: (studentId: string, decision: string) => void;
  clearOverride: (studentId: string) => void;
}

function Step3Students(p: Step3Props) {
  const [filterClass, setFilterClass] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<string>("");

  // Detection des niveaux d'examen d'Etat (DEF/BAC)
  const stateExamClasses = useMemo(() => {
    const classes: Array<{ id: string; name: string; exam: string }> = [];
    const codes = new Map<string, string>(); // code -> exam type
    codes.set("9EME", "DEF");
    codes.set("12EME", "BAC");

    for (const cls of p.preview.classes) {
      // On ne peut pas savoir le code du niveau depuis preview, mais on peut
      // detecter via le nom (approx). Un vrai fix serait d'exposer levelCode
      // dans preview (TODO).
      const examType = cls.name.startsWith("9") ? "DEF"
        : cls.name.startsWith("12") || cls.name.startsWith("Terminale") ? "BAC"
        : null;
      if (examType) {
        classes.push({ id: cls.fromClassId, name: cls.name, exam: examType });
      }
    }
    return classes;
  }, [p.preview.classes]);

  // Filtrer les decisions
  const filtered = useMemo(() => {
    let list = p.preview.decisions;
    if (filterClass) {
      list = list.filter((d) => d.fromClassId === filterClass);
    }
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      list = list.filter((d) => {
        const name = `${d.lastName} ${d.firstName}`.toLowerCase();
        return name.includes(q) || d.matricule.toLowerCase().includes(q);
      });
    }
    return list;
  }, [p.preview.decisions, filterClass, filterSearch]);

  // Effectif total par classe
  const classCounts = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    for (const d of p.preview.decisions) {
      if (!map[d.fromClassId]) {
        map[d.fromClassId] = { name: d.fromClassName, count: 0 };
      }
      map[d.fromClassId].count++;
    }
    return map;
  }, [p.preview.decisions]);

  return (
    <div className="space-y-4">
      {/* AVERTISSEMENT DEF/BAC */}
      {stateExamClasses.length > 0 && (
        <Card className="border-purple-300 bg-purple-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-purple-900">
                Examens d'État détectés ({stateExamClasses.length} classe
                {stateExamClasses.length > 1 ? "s" : ""})
              </p>
              <p className="text-xs text-purple-800 mt-1">
                Les classes suivantes préparent un examen d'État (DEF ou BAC) :
              </p>
              <ul className="mt-2 ml-4 list-disc text-xs text-purple-900">
                {stateExamClasses.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong> — {c.exam}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-purple-800 mt-2">
                <strong>Important :</strong> saisissez les résultats de
                l'examen d'État AVANT de valider cette étape, sinon les élèves
                seront marqués « Non inscrit ».
              </p>
              <Link
                to="/state-exams"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-purple-700 hover:underline"
              >
                Aller à la saisie des résultats →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STATS */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold mb-3">
            Statistiques des décisions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              label="Admis"
              value={p.preview.stats.ADMIS}
              cls="bg-green-50 text-green-700 border-green-200"
            />
            <StatBox
              label="Redoublants"
              value={p.preview.stats.REDOUBLE}
              cls="bg-amber-50 text-amber-700 border-amber-200"
            />
            <StatBox
              label="Quittent / Diplômés"
              value={p.preview.stats.QUITTE_ECOLE + p.preview.stats.DIPLOME}
              cls="bg-gray-50 text-gray-700 border-gray-200"
            />
            <StatBox
              label="Non inscrits"
              value={p.preview.stats.NON_INSCRIT}
              cls="bg-red-50 text-red-700 border-red-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* FILTRES */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Toutes les classes</option>
              {Object.entries(classCounts).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.name} ({info.count})
                </option>
              ))}
            </select>
            <div className="relative sm:col-span-2">
              <Input
                placeholder="Rechercher un élève (nom, matricule)..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} élève(s) affiché(s) · Modification ligne par ligne
            possible avant validation
          </p>
        </CardContent>
      </Card>

      {/* TABLEAU */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium">Élève</th>
                  <th className="text-left p-3 font-medium">Classe actuelle</th>
                  <th className="text-left p-3 font-medium">Décision proposée</th>
                  <th className="text-left p-3 font-medium">Classe cible</th>
                  <th className="text-left p-3 font-medium w-40">Modifier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const currentDecision = p.overrides[d.studentId] || d.decision;
                  const isOverridden = !!p.overrides[d.studentId];
                  return (
                    <tr
                      key={d.studentId}
                      className={cn(
                        "border-b last:border-0",
                        isOverridden && "bg-amber-50/30",
                      )}
                    >
                      <td className="p-3">
                        <div className="font-medium">
                          {d.lastName.toUpperCase()} {d.firstName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {d.matricule}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {d.fromClassName}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-xs font-medium border",
                            DECISION_STYLE[currentDecision] ||
                              "bg-gray-100 text-gray-700",
                          )}
                        >
                          {DECISION_LABEL[currentDecision] || currentDecision}
                        </span>
                        <div className="text-xs text-muted-foreground mt-1">
                          {d.note}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {d.targetClassName || "—"}
                      </td>
                      <td className="p-3">
                        <select
                          value={currentDecision}
                          onChange={(e) =>
                            p.setOverride(d.studentId, e.target.value)
                          }
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="ADMIS">Admis</option>
                          <option value="REDOUBLE">Redouble</option>
                          <option value="QUITTE_ECOLE">Quitte l'école</option>
                          <option value="DIPLOME">Diplômé</option>
                          <option value="NON_INSCRIT">Non inscrit</option>
                        </select>
                        {isOverridden && (
                          <button
                            type="button"
                            onClick={() => p.clearOverride(d.studentId)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            Rétablir la proposition
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className={cn("rounded-lg border p-3", cls)}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

interface Step4Props {
  preview: PreviewYearRolloverResult;
  overrides: Record<string, string>;
  onExecute: () => void;
  isExecuting: boolean;
  result: {
    newYearId: string;
    newYearLabel: string;
    periodsCreated: number;
    classesCreated: number;
    feesCreated: number;
    enrollmentsCreated: number;
    skipped: number;
  } | null;
}

function Step4Confirm(p: Step4Props) {
  // Si execution reussie -> ecran de succes
  if (p.result) {
    return (
      <Card className="border-green-300 bg-green-50/30">
        <CardContent className="p-8 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-900">
              Année {p.result.newYearLabel} créée !
            </h2>
            <p className="text-sm text-green-700 mt-1">
              L'année est en statut <strong>En préparation</strong>. Activez-la
              à la rentrée.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto pt-4">
            <SuccessBox label="Périodes" value={p.result.periodsCreated} />
            <SuccessBox label="Classes" value={p.result.classesCreated} />
            <SuccessBox label="Tarifs" value={p.result.feesCreated} />
            <SuccessBox label="Inscriptions" value={p.result.enrollmentsCreated} />
            <SuccessBox label="Non inscrits" value={p.result.skipped} />
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-6">
            <Button asChild>
              <Link to="/academic-years">
                <Calendar className="h-4 w-4 mr-2" />
                Voir les années
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">
                Retour au tableau de bord
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sinon -> confirmation avant execution
  const decisionsCount = p.preview.decisions.length;
  const overrideCount = Object.keys(p.overrides).length;

  return (
    <div className="space-y-4">
      {/* RECAP */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Résumé de l'opération
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Année source
              </p>
              <p className="font-bold text-lg">{p.preview.sourceYear.label}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Nouvelle année
              </p>
              <p className="font-bold text-lg text-primary">
                {p.preview.newYear.label}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Dates
              </p>
              <p className="font-medium text-xs">
                {new Date(p.preview.newYear.startDate).toLocaleDateString("fr-FR")} →{" "}
                {new Date(p.preview.newYear.endDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHIFFRES */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold mb-3">Éléments à créer</h3>
          <div className="space-y-1.5 text-sm">
            <RecapLine label="Périodes" value={p.preview.periods.length} />
            <RecapLine label="Classes" value={p.preview.classes.length} />
            <RecapLine label="Tarifs" value={p.preview.feeStructures.length} />
            <RecapLine label="Élèves à inscrire" value={decisionsCount} />
            {overrideCount > 0 && (
              <RecapLine
                label="Décisions modifiées manuellement"
                value={overrideCount}
                highlight
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* WARNING */}
      <Card className="border-amber-300 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm text-amber-900">
              Action irréversible
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              L'année <strong>{p.preview.newYear.label}</strong> sera créée avec
              toutes ses données. L'année source{" "}
              <strong>{p.preview.sourceYear.label}</strong> reste intacte (à
              clôturer manuellement).
            </p>
            <p className="text-xs text-amber-800 mt-2 font-medium">
              Assurez-vous d'avoir une sauvegarde récente de la base.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* BOUTON */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={p.onExecute}
          disabled={p.isExecuting}
          className="px-8"
        >
          {p.isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Créer l'année {p.preview.newYear.label}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function SuccessBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-green-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-green-700">{label}</p>
      <p className="text-2xl font-bold text-green-900 mt-1">{value}</p>
    </div>
  );
}

function RecapLine({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5 border-b last:border-0",
        highlight && "bg-amber-50/50 -mx-2 px-2 rounded",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
