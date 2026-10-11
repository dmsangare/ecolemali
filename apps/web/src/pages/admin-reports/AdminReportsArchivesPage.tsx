import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Archive, ArrowLeft, FileSpreadsheet, FileText, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminReportsApi, REPORT_STATUS_LABELS } from "@/api/admin-reports";

export function AdminReportsArchivesPage() {
  const [codeFilter, setCodeFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const archivesQ = useQuery({
    queryKey: ["admin-reports", "archives", codeFilter],
    queryFn: () =>
      adminReportsApi.listArchives(codeFilter ? { code: codeFilter } : undefined),
  });

  const archives = archivesQ.data ?? [];

  const filtered = searchText
    ? archives.filter(
        (r) =>
          r.title.toLowerCase().includes(searchText.toLowerCase()) ||
          r.code.toLowerCase().includes(searchText.toLowerCase()) ||
          (r.bordereauNumber ?? "").toLowerCase().includes(searchText.toLowerCase()),
      )
    : archives;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin-reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Archive className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Archives des rapports</h1>
            <p className="text-sm text-muted-foreground">
              Historique des rapports validés et transmis
            </p>
          </div>
        </div>
        <a href={adminReportsApi.downloadArchivesExcel()} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter en Excel
          </Button>
        </a>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                placeholder="Rechercher par titre, code, bordereau…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <select
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Tous les codes</option>
              <option value="RAP-02">RAP-02 — Rentrée</option>
              <option value="RAP-03">RAP-03 — Statistiques</option>
              <option value="RAP-04">RAP-04 — Personnel</option>
              <option value="RAP-05">RAP-05 — Infrastructures</option>
              <option value="RAP-06">RAP-06 — Situation annuelle</option>
              <option value="RAP-07">RAP-07 — Fin d'année</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filtered.length} rapport{filtered.length > 1 ? "s" : ""} archivé
            {filtered.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archivesQ.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun rapport archivé pour le moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Code</th>
                    <th className="text-left p-2 font-medium">Titre</th>
                    <th className="text-left p-2 font-medium">Année</th>
                    <th className="text-left p-2 font-medium">Statut</th>
                    <th className="text-left p-2 font-medium">Bordereau</th>
                    <th className="text-right p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const tr = r.transmissions?.[0];
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">{r.code}</td>
                        <td className="p-2 font-medium">
                          <Link
                            to={`/admin-reports/${r.id}`}
                            className="hover:underline"
                          >
                            {r.title}
                          </Link>
                        </td>
                        <td className="p-2 text-muted-foreground">
                          {r.academicYear
                            ? `${new Date(r.academicYear.startDate).getFullYear()}-${new Date(r.academicYear.endDate).getFullYear()}`
                            : "—"}
                        </td>
                        <td className="p-2">
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                            {REPORT_STATUS_LABELS[r.status]}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">
                          {r.bordereauNumber ?? "—"}
                        </td>
                        <td className="p-2 text-right">
                          <a
                            href={adminReportsApi.downloadPdf(r.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              PDF
                            </Button>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
