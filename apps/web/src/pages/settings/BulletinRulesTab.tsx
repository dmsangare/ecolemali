import { useState, useEffect } from "react";
import { Award, Loader2, Check, RotateCcw, Info } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSettings, useUpdateSettings } from "@/hooks/settings/useSettings";

interface CycleRules {
  gradingScale: number;
  passMark: number;
  evaluations: number;
  hasCoefficients: boolean;
}

interface BulletinRules {
  firstCycle: CycleRules;
  secondCycle: CycleRules;
}

const DEFAULT_RULES: BulletinRules = {
  firstCycle: { gradingScale: 10, passMark: 5, evaluations: 9, hasCoefficients: false },
  secondCycle: { gradingScale: 20, passMark: 10, evaluations: 3, hasCoefficients: true },
};

export function BulletinRulesTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [cycle, setCycle] = useState<"firstCycle" | "secondCycle">("firstCycle");
  const [rules, setRules] = useState<BulletinRules>(DEFAULT_RULES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.data?.bulletinRules) {
      setRules({ ...DEFAULT_RULES, ...settings.data.bulletinRules });
    }
  }, [settings]);

  const currentRules = rules[cycle];

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      data: {
        ...(settings?.data || {}),
        bulletinRules: rules,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setRules(DEFAULT_RULES);
  };

  const updateCurrent = (key: keyof CycleRules, value: number | boolean) => {
    setRules({
      ...rules,
      [cycle]: { ...currentRules, [key]: value },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Règles des bulletins
        </CardTitle>
        <p className="text-sm text-slate-500">
          Configurez les règles de calcul par cycle. Ces paramètres sont utilisés lors de la génération des bulletins.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur de cycle */}
        <div className="flex gap-2">
          <Button
            variant={cycle === "firstCycle" ? "default" : "outline"}
            onClick={() => setCycle("firstCycle")}
          >
            1er cycle
          </Button>
          <Button
            variant={cycle === "secondCycle" ? "default" : "outline"}
            onClick={() => setCycle("secondCycle")}
          >
            2e cycle
          </Button>
        </div>

        {/* Description */}
        <div className={cn(
          "rounded-lg p-4 text-sm",
          cycle === "firstCycle"
            ? "bg-blue-50 border border-blue-200"
            : "bg-purple-50 border border-purple-200"
        )}>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              {cycle === "firstCycle" ? (
                <>
                  <strong>1er cycle :</strong> compositions mensuelles, notes sur 10, sans coefficients.
                  Moyenne annuelle = (Compo_1 + ... + Compo_9) / 9.
                </>
              ) : (
                <>
                  <strong>2e cycle :</strong> 3 trimestres, notes sur 20, avec coefficients.
                  Moyenne annuelle = (Trim_1 + Trim_2 + Trim_3) / 3.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Champs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gradingScale">Barème (note maximale)</Label>
            <Input
              id="gradingScale"
              type="number"
              min={1}
              max={100}
              value={currentRules.gradingScale}
              onChange={(e) => updateCurrent("gradingScale", Number(e.target.value))}
              disabled={updateSettings.isPending}
            />
            <p className="text-xs text-slate-500 mt-1">
              Les notes seront sur {currentRules.gradingScale}.
            </p>
          </div>
          <div>
            <Label htmlFor="passMark">Seuil de passage</Label>
            <Input
              id="passMark"
              type="number"
              step="0.5"
              min={0}
              max={currentRules.gradingScale}
              value={currentRules.passMark}
              onChange={(e) => updateCurrent("passMark", Number(e.target.value))}
              disabled={updateSettings.isPending}
            />
            <p className="text-xs text-slate-500 mt-1">
              Moyenne minimale pour passer ({currentRules.passMark}/{currentRules.gradingScale}).
            </p>
          </div>
          <div>
            <Label htmlFor="evaluations">
              Nombre d'évaluations {cycle === "firstCycle" ? "(compositions)" : "(trimestres)"}
            </Label>
            <Input
              id="evaluations"
              type="number"
              min={1}
              max={20}
              value={currentRules.evaluations}
              onChange={(e) => updateCurrent("evaluations", Number(e.target.value))}
              disabled={updateSettings.isPending}
            />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <input
                id="hasCoefficients"
                type="checkbox"
                checked={currentRules.hasCoefficients}
                onChange={(e) => updateCurrent("hasCoefficients", e.target.checked)}
                disabled={updateSettings.isPending}
                className="h-4 w-4"
              />
              <Label htmlFor="hasCoefficients" className="cursor-pointer">
                Coefficients par matière
              </Label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement…
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enregistré
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={updateSettings.isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Rétablir les valeurs par défaut
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
