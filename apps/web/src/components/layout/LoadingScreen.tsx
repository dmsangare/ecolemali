import { Loader2 } from "lucide-react";

export function LoadingScreen({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
