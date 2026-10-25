import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageLoaderProps {
  label?: string;
  className?: string;
}

export function PageLoader({
  label = "Chargement…",
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-sis-brand" />
      <p className="text-sm">{label}</p>
    </div>
  );
}