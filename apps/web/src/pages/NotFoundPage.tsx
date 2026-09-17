import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-8">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-3xl font-bold">Page introuvable</h1>
      <p className="text-muted-foreground">
        La page que vous recherchez n existe pas.
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
