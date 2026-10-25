import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  accent?: "brand" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

const accentClasses: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  brand:   "bg-sis-brand-50 text-sis-brand dark:bg-sis-brand-900/30 dark:text-sis-brand-300",
  success: "bg-sis-success-bg text-sis-success dark:bg-sis-success-bg dark:text-sis-success",
  warning: "bg-sis-warning-bg text-sis-warning dark:bg-sis-warning-bg dark:text-sis-warning",
  danger:  "bg-sis-danger-bg text-sis-danger dark:bg-sis-danger-bg dark:text-sis-danger",
  info:    "bg-sis-info-bg text-sis-info dark:bg-sis-info-bg dark:text-sis-info",
  neutral: "bg-sis-neutral-100 text-sis-neutral-700 dark:bg-sis-neutral-800 dark:text-sis-neutral-200",
};

export function KpiCard({
  label,
  value,
  hint,
  icon,
  trend,
  accent = "brand",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-sis-lg border border-sis-neutral-200 bg-card p-5 shadow-sis-sm transition-shadow hover:shadow-sis dark:border-sis-neutral-800",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-sis-md",
              accentClasses[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend.direction === "up" && (
            <ArrowUpRight className="h-3.5 w-3.5 text-sis-success" />
          )}
          {trend.direction === "down" && (
            <ArrowDownRight className="h-3.5 w-3.5 text-sis-danger" />
          )}
          <span
            className={cn(
              "font-medium",
              trend.direction === "up" && "text-sis-success",
              trend.direction === "down" && "text-sis-danger",
              trend.direction === "neutral" && "text-muted-foreground"
            )}
          >
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}