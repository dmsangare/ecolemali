import { useState } from "react";
import {
  X, Sparkles, CheckCircle2, AlertCircle, Calendar, Clock,
  ChevronRight, Loader2, PartyPopper,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSetupStatus, useCreatePeriods } from "@/hooks/school/useSetup";
import type { PeriodsChoice } from "@/api/setup";

interface Props {
  onClose: () => void;
}

type Step = "welcome" | "periods" | "done";

export function SetupWizardModal({ onClose }: Props) {
  const { user } = useAuth();
  const { data: status, refetch } = useSetupStatus(user?.schoolId);
  const createPeriods = useCreatePeriods();

  const [step, setStep] = useState<Step>("welcome");
  const [periodsChoice, setPeriodsChoice] = useState<PeriodsChoice>("BOTH");
  const [createdCount, setCreatedCount] = useState(0);

  const handleCreatePeriods = async () => {
    if (!user?.schoolId) return;
    const res = await createPeriods.mutateAsync({
      schoolId: user.schoolId,
      periods: periodsChoice,
    });
    setCreatedCount(res.created);
    await refetch();
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Assistant de configuration</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Etape {step === "welcome" ? "1" : step === "periods" ? "2" : "3"} sur 3
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* CORPS */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* ETAPE 1 : Bienvenue */}
          {step === "welcome" && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Bienvenue dans votre configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Nous allons vous aider a configurer les elements essentiels de votre
                  etablissement. Vous pourrez modifier ces parametres a tout moment.
                </p>
              </div>

              {status && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="font-medium text-sm">Etat actuel</p>
                    <div className="space-y-2">
                      {Object.entries(status.steps).map(([key, done]) => {
                        const LABELS: Record<string, string> = {
                          schoolInfo: "Informations de l'ecole",
                          academicYear: "Annee scolaire",
                          periods: "Periodes (trimestres / mois)",
                          levels: "Niveaux",
                          classes: "Classes",
                          subjects: "Matieres",
                          users: "Utilisateurs",
                          students: "Eleves",
                        };
                        return (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            {done ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                            )}
                            <span className={done ? "text-muted-foreground" : ""}>
                              {LABELS[key] || key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {status && !status.academicYear && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
                  <p className="font-medium text-orange-800">Annee scolaire manquante</p>
                  <p className="text-orange-700 mt-1">
                    Veuillez d'abord creer une annee scolaire dans les parametres.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ETAPE 2 : Periodes */}
          {step === "periods" && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Periodes de l'annee</h3>
                <p className="text-sm text-muted-foreground">
                  Choisissez le type de periodes utilisees par votre etablissement.
                </p>
              </div>

              <div className="space-y-2">
                <PeriodOption
                  value="TRIMESTRE"
                  current={periodsChoice}
                  onChange={setPeriodsChoice}
                  title="3 Trimestres"
                  description="Systeme classique du 2e cycle (7eme a 9eme annee)"
                  icon={<Calendar className="h-5 w-5" />}
                />
                <PeriodOption
                  value="MOIS"
                  current={periodsChoice}
                  onChange={setPeriodsChoice}
                  title="9 Mois (compositions mensuelles)"
                  description="Systeme du 1er cycle (1ere a 6eme annee)"
                  icon={<Clock className="h-5 w-5" />}
                />
                <PeriodOption
                  value="BOTH"
                  current={periodsChoice}
                  onChange={setPeriodsChoice}
                  title="Les deux (recommande)"
                  description="Trimestres ET mois. L'application filtrera selon le cycle."
                  icon={<Sparkles className="h-5 w-5" />}
                  recommended
                />
              </div>
            </>
          )}

          {/* ETAPE 3 : Termine */}
          {step === "done" && (
            <div className="text-center space-y-4 py-6">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <PartyPopper className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Configuration terminee</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {createdCount > 0
                    ? `${createdCount} periode(s) ont ete creee(s) avec succes.`
                    : "Les periodes existaient deja."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button type="button" variant="outline" onClick={onClose}>
            {step === "done" ? "Fermer" : "Plus tard"}
          </Button>

          {step === "welcome" && (
            <Button
              type="button"
              onClick={() => setStep("periods")}
              disabled={!status?.academicYear}
            >
              Continuer
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {step === "periods" && (
            <Button
              type="button"
              onClick={handleCreatePeriods}
              disabled={createPeriods.isPending}
            >
              {createPeriods.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Creer les periodes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PeriodOption({
  value,
  current,
  onChange,
  title,
  description,
  icon,
  recommended,
}: {
  value: PeriodsChoice;
  current: PeriodsChoice;
  onChange: (v: PeriodsChoice) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
}) {
  const isSelected = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "w-full text-left rounded-lg border p-4 transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "hover:bg-muted/50",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{title}</p>
            {recommended && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                Recommande
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        {isSelected && (
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        )}
      </div>
    </button>
  );
}
