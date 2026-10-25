import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;   // Filtres custom (Select, DatePicker…)
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  children,
  onReset,
  resetLabel = "Réinitialiser",
  className,
}: FilterBarProps) {
  const hasSearch = typeof onSearchChange === "function";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-sis-lg border border-sis-neutral-200 bg-card p-3 dark:border-sis-neutral-800",
        className
      )}
    >
      {hasSearch && (
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-sis-neutral-100 dark:hover:bg-sis-neutral-800"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {children}
      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-3.5 w-3.5" />
          {resetLabel}
        </Button>
      )}
    </div>
  );
}