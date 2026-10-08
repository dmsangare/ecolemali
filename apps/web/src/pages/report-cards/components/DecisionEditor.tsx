import { cn } from "@/lib/utils";
import { DECISION_LABELS } from "@/types/report-cards";
import type { ReportDecision } from "@/types/report-cards";

interface DecisionEditorProps {
  value: ReportDecision | null;
  disabled?: boolean;
  onChange: (value: ReportDecision) => void;
}

export function DecisionEditor({ value, disabled, onChange }: DecisionEditorProps) {
  const decisions: ReportDecision[] = [
    "ADMIS",
    "REDOUBLE",
    "EXCLU",
    "A_DETERMINER",
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {decisions.map((d) => {
          const isSelected = value === d;
          const colorClass =
            d === "ADMIS"
              ? "border-green-500 bg-green-50 dark:bg-green-950/30"
              : d === "REDOUBLE"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                  : d === "EXCLU"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                    : "border-gray-400 bg-gray-50 dark:bg-gray-950/30";

          return (
            <button
              key={d}
              type="button"
              onClick={() => !disabled && onChange(d)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border-2 text-left text-sm font-medium transition-all",
                isSelected
                  ? colorClass
                  : "border-input hover:border-primary/50",
                disabled && "opacity-60 cursor-not-allowed",
              )}
            >
              <span
                className={cn(
                  "h-3 w-3 rounded-full shrink-0",
                  isSelected ? "bg-current" : "bg-muted-foreground/30",
                )}
              />
              {DECISION_LABELS[d]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
