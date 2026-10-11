import { FileText } from "lucide-react";

export function AdminReportsListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports administratifs</h1>
          <p className="text-sm text-muted-foreground">
            Préparation, validation et transmission des rapports aux autorités
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Module en cours d'installation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La liste des rapports sera disponible après le prochain build.
        </p>
      </div>
    </div>
  );
}
