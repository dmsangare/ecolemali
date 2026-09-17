import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Loader2, Eye } from "lucide-react";
import { useAssessments } from "@/hooks/assessments";
import { formatDate } from "@/lib/formatters";
import { Button, Card, CardContent } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouverte",
  SUBMITTED: "Soumise",
  VALIDATED: "Validee",
  LOCKED: "Verrouillee",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-700",
  OPEN: "bg-blue-500/10 text-blue-700",
  SUBMITTED: "bg-orange-500/10 text-orange-700",
  VALIDATED: "bg-green-500/10 text-green-700",
  LOCKED: "bg-purple-500/10 text-purple-700",
};

export function AssessmentsListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAssessments({ page, limit: 20 });

  const assessments = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Notes et Evaluations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total || 0} evaluation(s)
          </p>
        </div>
        <Button asChild>
          <Link to="/grades/new">
            <Plus className="h-4 w-4" />
            Nouvelle evaluation
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucune evaluation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Titre</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Matiere</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{a.title}</td>
                      <td className="px-4 py-3 text-sm">{a.class?.name}</td>
                      <td className="px-4 py-3 text-sm">{a.subject?.name}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(a.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                          {STATUS_LABELS[a.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{a._count?.grades || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/grades/${a.id}`}>
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
