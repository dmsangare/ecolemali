import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  success: "bg-sis-success-bg text-sis-success border-sis-success-border",
  danger: "bg-sis-danger-bg text-sis-danger border-sis-danger-border",
  warning: "bg-sis-warning-bg text-sis-warning-foreground border-sis-warning-border",
  info: "bg-sis-info-bg text-sis-info border-sis-info-border",
  purple: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300",
  gray: "bg-sis-neutral-100 text-sis-neutral-700 border-sis-neutral-200 dark:bg-sis-neutral-800 dark:text-sis-neutral-300 dark:border-sis-neutral-700",
  pink: "bg-pink-500/10 text-pink-700 border-pink-500/20 dark:bg-pink-500/20 dark:text-pink-300",
  yellow: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300",
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({
  label,
  variant = "gray",
  icon,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}