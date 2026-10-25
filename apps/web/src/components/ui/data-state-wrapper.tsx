import * as React from "react";
import { cn } from "@/lib/utils";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";
import { SkeletonTable, SkeletonCard } from "./loading-skeleton";

export interface DataStateWrapperProps {
  /** Chargement en cours */
  isLoading?: boolean;
  /** Erreur de chargement */
  isError?: boolean;
  /** Données vides (à fournir seulement si le parent sait que c'est vide) */
  isEmpty?: boolean;
  /** Callback pour réessayer (utilisé en cas d'erreur) */
  onRetry?: () => void;

  /** Variante de skeleton pendant le chargement */
  loadingVariant?: "table" | "card" | "none";

  /** Titre état vide */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;

  /** Titre état erreur */
  errorTitle?: string;
  errorDescription?: string;

  className?: string;
  children: React.ReactNode;
}

/**
 * Composant utilitaire qui affiche automatiquement l'état visuel approprié
 * en fonction des props (loading / error / empty / success).
 *
 * Usage :
 *   <DataStateWrapper
 *     isLoading={query.isLoading}
 *     isError={query.isError}
 *     isEmpty={query.data?.length === 0}
 *     onRetry={() => query.refetch()}
 *   >
 *     <MaListe data={query.data} />
 *   </DataStateWrapper>
 */
export function DataStateWrapper({
  isLoading = false,
  isError = false,
  isEmpty = false,
  onRetry,
  loadingVariant = "table",
  emptyTitle = "Aucune donnée",
  emptyDescription,
  emptyIcon,
  emptyAction,
  errorTitle,
  errorDescription,
  className,
  children,
}: DataStateWrapperProps) {
  if (isLoading) {
    if (loadingVariant === "none") return null;
    return (
      <div className={cn(className)}>
        {loadingVariant === "card" ? (
          <SkeletonCard />
        ) : (
          <SkeletonTable rows={5} cols={4} />
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(className)}>
        <ErrorState
          title={errorTitle}
          description={errorDescription}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn(className)}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={emptyAction}
        />
      </div>
    );
  }

  return <>{children}</>;
}