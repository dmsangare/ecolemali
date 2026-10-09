import { useState, useEffect } from "react";
import { Award, Loader2, Check, RotateCcw, Info } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSettings, useUpdateThresholds } from "@/hooks/settings/useSettings";
import { DEFAULT_THRESHOLDS } from "@/types/report-cards";
import { FinanceAlertsCard } from "./FinanceAlertsCard";

// Definition des seuils avec ordre decroissant
const THRESHOLD_KEYS = [
  { key: "excellent", label: "Excellent", color: "text-green-700 bg-green-50 border-green-300" },
  { key: "tresBien", label: "TrÃ¨s bien", color: "text-green-600 bg-green-50 border-green-200" },
  { key: "bien", label: "Bien", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "assezBien", label: "Assez bien", color: "text-blue-500 bg-blue-50 border-blue-200" },
  { key: "passable", label: "Passable", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { key: "insuffisant", label: "Insuffisant", color: "text-red-600 bg-red-50 border-red-200" },
] as const;

export function ThresholdsTab() {
  const { data: settings, isLoading } = useSettings();
  const updateThresholds = useUpdateThresholds();

  const savedThresholds = {
    excellent: settings?.data?.thresholds?.excellent ?? DEFAULT_THRESHOLDS.excellent,
    tresBien: settings?.data?.thresholds?.tresBien ?? DEFAULT_THRESHOLDS.tresBien,
    bien: settings?.data?.thresholds?.bien ?? DEFAULT_THRESHOLDS.bien,
    assezBien: settings?.data?.thresholds?.assezBien ?? DEFAULT_THRESHOLDS.assezBien,
    passable: settings?.data?.thresholds?.passable ?? DEFAULT_THRESHOLDS.passable,
    insuffisant: settings?.data?.thresholds?.insuffisant ?? DEFAULT_THRESHOLDS.insuffisant,
  };

  const [thresholds, setThresholds] = useState(savedThresholds);

  useEffect(() => {
    setThresholds(savedThresholds);
  }, [settings?.data?.thresholds]);

  const hasChanges = THRESHOLD_KEYS.some(
    ({ key }) => thresholds[key] !== savedThresholds[key]
  );

  // Validation : les seuils doivent etre decroissants
  const isValid =
    thresholds.excellent > thresholds.tresBien &&
    thresholds.tresBien > thresholds.bien &&
    thresholds.bien > thresholds.assezBien &&
    thresholds.assezBien > thresholds.passable &&
    thresholds.passable > thresholds.insuffisant &&
    thresholds.insuffisant >= 0;

  const handleSave = async () => {
    if (!isValid) return;
    await updateThresholds.mutateAsync(thresholds);
  };

  const handleReset = () => {
    setThresholds({ ...DEFAULT_THRESHOLDS });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* INFO */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-blue-900">
                Seuils des appreciations
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Configurez les moyennes minimales (sur /20) pour chaque niveau
                d'appreciation. Ces seuils s'appliquent automatiquement aux
                bulletins. Les moyennes sont normalisees sur /20 pour la
                comparaison (ex. 8/10 = 16/20).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEUILS */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5 text-primary" />
                Grille des appreciations (sur /20)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Les seuils doivent etre decroissants (Excellent &gt; Tres bien &gt; ...).
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Defaut
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {THRESHOLD_KEYS.map(({ key, label, color }) => (
            <div
              key={key}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-3",
                color,
              )}
            >
              <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-xs opacity-80">Moyenne superieure ou egale a</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={thresholds[key]}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      [key]: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-20 text-center bg-white"
                />
                <span className="text-sm font-medium opacity-70">/20</span>
              </div>
            </div>
          ))}

          {/* Erreur de validation */}
          {!isValid && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              <strong>Erreur de validation :</strong> Les seuils doivent etre
              strictement decroissants (Excellent &gt; TrÃ¨s bien &gt; Bien &gt;
              Assez bien &gt; Passable &gt; Insuffisant).
            </div>
          )}
        </CardContent>
      </Card>

      {/* APERCU */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apercu</CardTitle>
          <p className="text-sm text-muted-foreground">
            Voici comment les appreciations seront attribuees.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { avg: thresholds.excellent + 0.5, label: "Excellent" },
              { avg: thresholds.tresBien + 0.5, label: "TrÃ¨s bien" },
              { avg: thresholds.bien + 0.5, label: "Bien" },
              { avg: thresholds.assezBien + 0.5, label: "Assez bien" },
              { avg: thresholds.passable + 0.5, label: "Passable" },
              { avg: thresholds.insuffisant + 0.5, label: "Insuffisant" },
            ].map((ex) => (
              <div
                key={ex.label}
                className="rounded border p-2 text-sm text-center bg-muted/30"
              >
                <p className="font-mono text-xs text-muted-foreground">
                  {ex.avg.toFixed(1)}/20
                </p>
                <p className="font-medium">{ex.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ALERTES FINANCE */}
      <FinanceAlertsCard />

      {/* ACTIONS */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || !isValid || updateThresholds.isPending}
        >
          {updateThresholds.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Enregistrer les seuils
        </Button>
      </div>
    </div>
  );
}
