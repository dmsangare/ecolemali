import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Impossible de charger les données. Veuillez réessayer.",
  onRetry,
  retryLabel = "Réessayer",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-sis-lg border border-sis-danger-border bg-sis-danger-bg/40 px-6 py-12 text-center dark:bg-sis-danger-bg/20",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sis-danger-bg text-sis-danger dark:bg-sis-danger-bg/40">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}