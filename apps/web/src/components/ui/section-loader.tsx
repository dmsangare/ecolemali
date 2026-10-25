import * as React from "react";
import { cn } from "@/lib/utils";
import { SkeletonLine } from "./loading-skeleton";

export interface SectionLoaderProps {
  title?: string;
  lines?: number;
  className?: string;
}

/**
 * Skeleton léger pour une "section" (carte avec un titre + quelques lignes).
 * Plus discret que SkeletonCard — utile pour un bloc dans une page déjà chargée.
 */
export function SectionLoader({
  title,
  lines = 3,
  className,
}: SectionLoaderProps) {
  return (
    <div
      className={cn(
        "rounded-sis-lg border border-sis-neutral-200 bg-card p-6 dark:border-sis-neutral-800",
        className
      )}
      role="status"
      aria-label={title ?? "Chargement de la section"}
    >
      {title && (
        <div className="mb-4 h-5 w-40 animate-pulse rounded-sis-sm bg-sis-neutral-200/70 dark:bg-sis-neutral-800" />
      )}
      <SkeletonLine lines={lines} />
    </div>
  );
}