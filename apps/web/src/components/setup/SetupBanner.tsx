import { useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle, ChevronRight, X } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useSetupStatus } from "@/hooks/school/useSetup";
import { SetupWizardModal } from "./SetupWizardModal";

export function SetupBanner() {
  const { user } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data: status, isLoading } = useSetupStatus(user?.schoolId);

  // Ne rien afficher si :
  // - chargement en cours
  // - l'utilisateur n'a pas d'ecole
  // - tout est configure
  // - l'utilisateur a ferme la banniere
  if (isLoading || !status || status.isConfigured || dismissed) {
    return null;
  }

  const progress = Math.round((status.completed / status.total) * 100);

  // Liste lisible des etapes restantes
  const STEP_LABELS: Record<string, string> = {
    schoolInfo: "Informations de l'ecole",
    academicYear: "Annee scolaire",
    periods: "Periodes (trimestres / mois)",
    levels: "Niveaux",
    classes: "Classes",
    subjects: "Matieres",
    users: "Utilisateurs",
    students: "Eleves",
  };

  const missingSteps = Object.entries(status.steps)
    .filter(([_, done]) => !done)
    .map(([key]) => STEP_LABELS[key]);

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    Configuration initiale
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Completez ces etapes pour preparer votre etablissement
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDismissed(true)}
                  className="shrink-0"
                  title="Masquer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Barre de progression */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {status.completed} sur {status.total} etapes
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Etapes restantes */}
              {missingSteps.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {missingSteps.slice(0, 4).map((step) => (
                    <span
                      key={step}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-100 text-orange-800"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {step}
                    </span>
                  ))}
                  {missingSteps.length > 4 && (
                    <span className="text-xs px-2 py-1 text-muted-foreground">
                      +{missingSteps.length - 4} autres
                    </span>
                  )}
                </div>
              )}

              <Button onClick={() => setWizardOpen(true)} className="mt-2">
                Continuer la configuration
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {wizardOpen && (
        <SetupWizardModal onClose={() => setWizardOpen(false)} />
      )}
    </>
  );
}
