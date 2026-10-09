import { useState, useEffect } from "react";
import { Trophy, Loader2, Check, Info } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/settings/useSettings";
import { settingsApi } from "@/api/settings";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const DEFAULT_TOP_N = 3;
const TOP_N_OPTIONS = [3, 5, 10] as const;

export function HonorRollTab() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSettings();

  const savedTopN: number =
    settings?.data?.honorRoll?.topN ?? DEFAULT_TOP_N;
  const [topN, setTopN] = useState<number>(savedTopN);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTopN(savedTopN);
  }, [savedTopN]);

  const hasChanges = topN !== savedTopN;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const current = settings?.data ?? {};
      const merged = {
        ...current,
        honorRoll: { ...(current.honorRoll ?? {}), topN },
      };
      await settingsApi.update({ data: merged } as any);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "honor-roll"] });
      toast.success("Parametres du tableau d'honneur enregistres");
    } catch {
      toast.error("Impossible d'enregistrer");
    } finally {
      setIsSaving(false);
    }
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
                Tableau d'honneur
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Le tableau d'honneur recompense les meilleures classes par
                cycle, sur la base de la moyenne des bulletins publies.
                Choisissez le nombre de classes a mettre en avant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OPTIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-primary" />
            Nombre de classes recompensees par cycle
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ce reglage s'applique a tous les cycles (1er cycle, 2e cycle, lycee).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {TOP_N_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTopN(n)}
                className={cn(
                  "rounded-lg border-2 p-6 text-center transition-colors",
                  topN === n
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50",
                )}
              >
                <p className="text-3xl font-bold">{n}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  classe{n > 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            Apercu : les <strong>{topN}</strong> meilleures classes de chaque
            cycle seront affichees sur le tableau d'honneur.
          </div>
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}