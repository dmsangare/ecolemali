import * as React from "react";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
 * Brique de base — Skeleton animé
 * ------------------------------------------------------------------------ */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sis-sm bg-sis-neutral-200/70 dark:bg-sis-neutral-800",
        className
      )}
      {...props}
    />
  );
}

/* --------------------------------------------------------------------------
 * Variante "ligne" — paragraphe de N lignes
 * ------------------------------------------------------------------------ */
export function SkeletonLine({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Variante "carte" — header + lignes + footer
 * ------------------------------------------------------------------------ */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-sis-lg border border-sis-neutral-200 bg-card p-6 dark:border-sis-neutral-800",
        className
      )}
    >
      <Skeleton className="mb-4 h-5 w-1/3" />
      <SkeletonLine lines={3} />
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Variante "tableau" — en-tête + N lignes
 * ------------------------------------------------------------------------ */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sis-lg border border-sis-neutral-200 bg-card dark:border-sis-neutral-800",
        className
      )}
    >
      <div className="grid gap-4 border-b border-sis-neutral-200 bg-sis-neutral-50 p-4 dark:border-sis-neutral-800 dark:bg-sis-neutral-900/60"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-3/4" />
        ))}
      </div>
      <div className="divide-y divide-sis-neutral-200 dark:divide-sis-neutral-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton };