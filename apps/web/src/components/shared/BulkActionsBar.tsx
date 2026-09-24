import { ReactNode } from "react";
import { X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui";

interface BulkAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  actions,
  onClear,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in-0">
      <div className="flex items-center gap-2 rounded-full border bg-card shadow-lg px-4 py-2">
        {/* Compteur */}
        <div className="flex items-center gap-2 pr-3 border-r">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CheckSquare className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} selectionne{selectedCount > 1 ? "s" : ""}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || "ghost"}
              size="sm"
              onClick={action.onClick}
              className="whitespace-nowrap"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Clear */}
        <div className="pl-3 border-l">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-7 w-7 rounded-full"
            title="Effacer la selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
