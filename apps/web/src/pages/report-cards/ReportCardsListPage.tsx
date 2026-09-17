import { useState } from "react";
import { Link } from "react-router-dom";
import { Award, Loader2, Eye, TrendingUp } from "lucide-react";
import { useReportCards } from "@/hooks/report-cards";
import { Button, Card, CardContent } from "@/components/ui";

const DECISION_LABELS: Record<string, string> = {
  ADMIS: "Admis",
  PASSE: "Passe",
  REDOUBLE: "Redouble",
  EXCLU: "Exclu",
  A_DETERMINER: "A determiner",
};

const DECISION_COLORS: Record<string, string> = {
  ADMIS: "bg-green-500/10 text-green-700",
  PASSE: "bg-blue-500/10 text-blue-700",
  REDOUBLE: "bg-orange-500/10 text-orange-700",
  EXCLU: "bg-red-500/10 text-red-700",
  A_DETERMINER: "bg-gray-500/10 text-gray-700",
};

export function ReportCardsListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReportCards({ page, limit: 20 });

  const reports = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6" />
            Bulletins
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total || 0} bulletin(s)
          </p>
        </div>
        <Button asChild>
          <Link to="/report-cards/generate">
            <TrendingUp className="h-4 w-4" />
            Generer des bulletins
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <Award className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun bulletin</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/report-cards/generate">
                  <TrendingUp className="h-4 w-4" />
                  Generer les bulletins
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Eleve</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Trimestre</th>
                    <th className="px-4 py-3">Moyenne</th>
                    <th className="px-4 py-3">Rang</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r: any) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">
                        {r.student?.lastName} {r.student?.firstName}
                      </td>
                      <td className="px-4 py-3 text-sm">{r.class?.name}</td>
                      <td className="px-4 py-3 text-sm">{r.term?.name}</td>
                      <td className="px-4 py-3 text-sm font-bold">
                        {r.average !== null ? r.average.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {r.rank !== null ? `${r.rank}/${r.classSize}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.decision && (
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${DECISION_COLORS[r.decision]}`}>
                            {DECISION_LABELS[r.decision]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/report-cards/${r.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
