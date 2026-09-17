import { Settings, School, BookOpen, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Parametres
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration de l etablissement et de votre compte
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mon compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Nom complet" value={`${user?.firstName} ${user?.lastName}`} />
          <InfoRow label="Email" value={user?.email || "—"} />
          <InfoRow label="Telephone" value={user?.phone || "—"} />
          <InfoRow label="Role" value={user?.roles?.join(", ") || "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Etablissement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow
            label="Nom"
            value={user?.school?.name || "Non defini"}
          />
          <InfoRow
            label="Code"
            value={user?.school?.code || "—"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Configuration systeme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La configuration avancee (matieres, coefficients, regles de calcul, documents)
            sera accessible dans une prochaine version.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
