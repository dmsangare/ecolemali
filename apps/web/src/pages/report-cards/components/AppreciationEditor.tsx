import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { getAppreciation } from "@/types/report-cards";

interface AppreciationEditorProps {
  value: string;
  average: number | null | undefined;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function AppreciationEditor({
  value,
  average,
  disabled,
  onChange,
}: AppreciationEditorProps) {
  const suggested = getAppreciation(average);

  const suggestions = [
    "Élève sérieux et travailleur.",
    "Doit poursuivre ses efforts.",
    "Résultats en progrès.",
    "Doit travailler davantage.",
    "Encourageant, peut mieux faire.",
    "Passable, doit redoubler d'efforts.",
  ];

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Appréciation générale du conseil de classe..."
        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
        maxLength={500}
      />

      <div className="flex flex-wrap items-center gap-2">
        {!value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(suggested)}
            disabled={disabled || !suggested || suggested === "—"}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Suggérer : {suggested}
          </Button>
        )}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            disabled={disabled}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Effacer
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {value.length}/500
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, 4).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => !disabled && onChange(s)}
            disabled={disabled}
            className="text-xs px-2 py-1 rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-60"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
