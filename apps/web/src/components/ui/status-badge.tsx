import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        neutral: "border-sis-neutral-200 bg-sis-neutral-100 text-sis-neutral-700 dark:border-sis-neutral-700 dark:bg-sis-neutral-800 dark:text-sis-neutral-200",
        success: "border-sis-success-border bg-sis-success-bg text-sis-success dark:bg-sis-success-bg dark:text-sis-success",
        warning: "border-sis-warning-border bg-sis-warning-bg text-sis-warning-foreground dark:bg-sis-warning-bg dark:text-sis-warning",
        danger:  "border-sis-danger-border bg-sis-danger-bg text-sis-danger dark:bg-sis-danger-bg dark:text-sis-danger",
        info:    "border-sis-info-border bg-sis-info-bg text-sis-info dark:bg-sis-info-bg dark:text-sis-info",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

const iconMap = {
  neutral: MinusCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
} as const;

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  showIcon?: boolean;
}

export function StatusBadge({
  className,
  variant = "neutral",
  showIcon = true,
  children,
  ...props
}: StatusBadgeProps) {
  const Icon = iconMap[variant ?? "neutral"];
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  );
}