import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

export function ForbiddenPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-8">
      <ShieldX className="h-16 w-16 text-destructive" />
      <h1 className="text-3xl font-bold">Acces refuse</h1>
      <p className="text-muted-foreground">
        Vous n avez pas les permissions necessaires pour acceder a cette page.
      </p>
      <Link
        to="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
