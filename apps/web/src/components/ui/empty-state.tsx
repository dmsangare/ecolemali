import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-sis-lg border border-dashed border-sis-neutral-200 bg-sis-neutral-50/50 px-6 py-12 text-center dark:border-sis-neutral-700 dark:bg-sis-neutral-900/40",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sis-brand-50 text-sis-brand dark:bg-sis-brand-900/30 dark:text-sis-brand-300">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}