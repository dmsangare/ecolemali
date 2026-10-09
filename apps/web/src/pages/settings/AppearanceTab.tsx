import { useState, useEffect } from "react";
import { Palette, Loader2, Check, RotateCcw } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSettings, useUpdateAppearance } from "@/hooks/settings/useSettings";

// Palette de couleurs predefinies
const PRESET_COLORS = [
  { name: "Bleu classique", value: "#2563eb" },
  { name: "Vert emeraude", value: "#059669" },
  { name: "Violet royal", value: "#7c3aed" },
  { name: "Rouge bordeaux", value: "#dc2626" },
  { name: "Orange chaleureux", value: "#ea580c" },
  { name: "Rose", value: "#db2777" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Ambre", value: "#d97706" },
  { name: "Noir elegant", value: "#1f2937" },
];

const DEFAULT_COLOR = "#2563eb";

export function AppearanceTab() {
  const { data: settings, isLoading } = useSettings();
  const updateAppearance = useUpdateAppearance();

  const savedColor = settings?.data?.appearance?.primaryColor || DEFAULT_COLOR;
  const [color, setColor] = useState(savedColor);

  // Synchroniser si les settings changent
  useEffect(() => {
    setColor(savedColor);
  }, [savedColor]);

  const hasChanges = color !== savedColor;

  const handleSave = async () => {
    await updateAppearance.mutateAsync({ primaryColor: color });
  };

  const handleReset = () => {
    setColor(DEFAULT_COLOR);
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
      {/* APERCU */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-5 w-5" />
            Couleur de l'application
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Personnalisez la couleur principale utilisee dans toute l'interface.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Apercu en direct */}
          <div className="space-y-3">
            <Label>Apercu</Label>
            <div
              className="rounded-lg border p-6 space-y-3"
              style={{ backgroundColor: `${color}10` }}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: color }}
                >
                  Bouton principal
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-sm font-medium border"
                  style={{ borderColor: color, color: color }}
                >
                  Bouton secondaire
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>Cette couleur apparaitra partout dans l'application</span>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <Label>Couleurs recommandees</Label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={cn(
                    "aspect-square rounded-lg border-2 transition-all relative",
                    color === preset.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {color === preset.value && (
                    <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Personnalisee */}
          <div className="space-y-3">
            <Label htmlFor="custom-color">Couleur personnalisee</Label>
            <div className="flex gap-3 items-center">
              <input
                id="custom-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 text-sm font-mono"
                placeholder="#2563eb"
                pattern="^#[0-9a-fA-F]{6}$"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reinitialiser
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateAppearance.isPending}
            >
              {updateAppearance.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
