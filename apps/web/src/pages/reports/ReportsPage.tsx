import { BarChart3, Users, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Rapports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Statistiques et analyses de votre etablissement
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportCard
          icon={Users}
          title="Eleves"
          description="Effectifs, repartition par sexe, niveau, classe"
        />
        <ReportCard
          icon={TrendingUp}
          title="Pedagogique"
          description="Moyennes, taux de reussite, top eleves"
        />
        <ReportCard
          icon={Wallet}
          title="Finance"
          description="Recettes, impayes, par categorie"
        />
        <ReportCard
          icon={BarChart3}
          title="Presence"
          description="Taux de presence, absences, retards"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapports detailles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les graphiques et tableaux detailles seront disponibles dans une prochaine version.
            Utilisez l API <code className="bg-muted px-1 rounded">/api/v1/reports/*</code> pour
            recuperer les donnees brutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary mb-3">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
