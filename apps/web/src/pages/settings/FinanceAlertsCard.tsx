import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Check, Info } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSettings, useUpdateFinance } from "@/hooks/settings/useSettings";
import { formatFCFA } from "@/types/finance";

const DEFAULT_WARNING = 25000;
const DEFAULT_CRITICAL = 100000;

export function FinanceAlertsCard() {
  const { data: settings } = useSettings();
  const updateFinance = useUpdateFinance();

  const savedWarning = settings?.data?.finance?.warningThreshold ?? DEFAULT_WARNING;
  const savedCritical = settings?.data?.finance?.criticalThreshold ?? DEFAULT_CRITICAL;

  const [warning, setWarning] = useState(savedWarning);
  const [critical, setCritical] = useState(savedCritical);

  useEffect(() => {
    setWarning(savedWarning);
    setCritical(savedCritical);
  }, [savedWarning, savedCritical]);

  const hasChanges = warning !== savedWarning || critical !== savedCritical;
  const isValid =
    warning > 0 && critical > 0 && critical > warning;

  const handleSave = async () => {
    if (!isValid) return;
    await updateFinance.mutateAsync({
      warningThreshold: warning,
      criticalThreshold: critical,
    });
  };

  const handleReset = () => {
    setWarning(DEFAULT_WARNING);
    setCritical(DEFAULT_CRITICAL);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Alertes impayes
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Colore automatiquement les soldes impayes des élèves dans le tableau de bord.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            Defaut
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/50 p-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Le seuil d'attention affiche un badge orange. Le seuil critique affiche un badge rouge.
            Montants en FCFA.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
              Seuil d'attention
            </Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={warning}
              onChange={(e) => setWarning(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              A partir de <strong>{formatFCFA(warning)}</strong>
            </p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
              Seuil critique
            </Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={critical}
              onChange={(e) => setCritical(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              A partir de <strong>{formatFCFA(critical)}</strong>
            </p>
          </div>
        </div>

        {!isValid && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            Le seuil critique doit etre strictement superieur au seuil d'attention.
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !isValid || updateFinance.isPending}
          >
            {updateFinance.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Enregistrer les seuils finance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
