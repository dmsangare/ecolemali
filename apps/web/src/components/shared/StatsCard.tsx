import { ReactNode } from "react";

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
  default: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-600",
  danger: "bg-red-500/10 text-red-600",
  warning: "bg-orange-500/10 text-orange-600",
  info: "bg-blue-500/10 text-blue-600",
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
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <p
              className={`text-xs font-medium mt-2 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${ICON_VARIANTS[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
