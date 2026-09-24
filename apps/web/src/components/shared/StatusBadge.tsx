import { ReactNode } from "react";

const VARIANTS = {
  success: "bg-green-500/10 text-green-700 border-green-500/20",
  danger: "bg-red-500/10 text-red-700 border-red-500/20",
  warning: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  info: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  gray: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  pink: "bg-pink-500/10 text-pink-700 border-pink-500/20",
  yellow: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
