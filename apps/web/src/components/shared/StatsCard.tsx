import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "danger" | "warning" | "info";
}

const ICON_VARIANTS = {
  default: "bg-sis-brand-50 text-sis-brand dark:bg-sis-brand-900/30 dark:text-sis-brand-300",
  success: "bg-sis-success-bg text-sis-success",
  danger: "bg-sis-danger-bg text-sis-danger",
  warning: "bg-sis-warning-bg text-sis-warning",
  info: "bg-sis-info-bg text-sis-info",
};

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  variant = "default",
}: StatsCardProps) {
  return (
    <div className="rounded-sis-lg border border-sis-neutral-200 bg-card p-6 shadow-sis-sm transition-shadow hover:shadow-sis dark:border-sis-neutral-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2 tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium">
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 text-sis-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-sis-danger" />
              )}
              <span
                className={cn(
                  trend.isPositive ? "text-sis-success" : "text-sis-danger"
                )}
              >
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-sis-md",
              ICON_VARIANTS[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}