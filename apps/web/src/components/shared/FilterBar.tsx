import { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";

export interface FilterOption {
  value: string;
  label: string;
  group?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "toggle";
  options?: FilterOption[];
  value: string | boolean;
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onFilterChange: (key: string, value: string | boolean) => void;
  onReset?: () => void;
  searchSlot?: ReactNode;
  actionsSlot?: ReactNode;
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  searchSlot,
  actionsSlot,
}: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => {
    if (f.type === "toggle") return f.value === true;
    return f.value !== "" && f.value !== "all";
  });

  const getGroupedOptions = (options: FilterOption[]) => {
    const groups: Record<string, FilterOption[]> = {};
    options.forEach((opt) => {
      const group = opt.group || "";
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    });
    return groups;
  };

  return (
    <Card className="rounded-sis-lg border-sis-neutral-200 shadow-sis-sm dark:border-sis-neutral-800">
      <CardContent className="pt-6 space-y-4">
        {/* Ligne 1 : Recherche + Actions */}
        {(searchSlot || actionsSlot) && (
          <div className="flex flex-wrap gap-3">
            {searchSlot}
            {actionsSlot}
          </div>
        )}

        {/* Ligne 2 : Filtres */}
        <div className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => {
            if (filter.type === "select") {
              const groups = getGroupedOptions(filter.options || []);
              const hasGroups =
                Object.keys(groups).length > 1 ||
                Object.keys(groups)[0] !== "";

              return (
                <select
                  key={filter.key}
                  value={String(filter.value)}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="h-9 rounded-sis-md border border-sis-neutral-200 bg-card px-3 text-sm min-w-[150px] transition-colors hover:border-sis-neutral-300 focus:outline-none focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700 dark:bg-sis-neutral-900 dark:hover:border-sis-neutral-600"
                >
                  <option value="all">
                    {filter.placeholder || filter.label}
                  </option>
                  {hasGroups
                    ? Object.entries(groups).map(([group, opts]) => (
                        <optgroup key={group} label={group}>
                          {opts.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      ))
                    : filter.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                </select>
              );
            }

            if (filter.type === "toggle") {
              return (
                <label
                  key={filter.key}
                  className="flex items-center gap-2 cursor-pointer rounded-sis-md border border-sis-neutral-200 px-3 h-9 hover:bg-sis-neutral-50 transition-colors dark:border-sis-neutral-700 dark:hover:bg-sis-neutral-800"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(filter.value)}
                    onChange={(e) =>
                      onFilterChange(filter.key, e.target.checked)
                    }
                    className="h-4 w-4 rounded border-input accent-sis-brand"
                  />
                  <span className="text-sm">{filter.label}</span>
                </label>
              );
            }

            return null;
          })}

          {hasActiveFilters && onReset && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}