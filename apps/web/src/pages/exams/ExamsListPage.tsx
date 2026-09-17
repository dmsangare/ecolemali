import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Loader2, Eye } from "lucide-react";
import { useExams } from "@/hooks/exams";
import { formatDate } from "@/lib/formatters";
import { Button, Card, CardContent } from "@/components/ui";

const TYPE_LABELS: Record<string, string> = {
  INTERNE: "Interne",
  COMPOSITION: "Composition",
  BLANC: "Examen blanc",
  FIN_ANNEE: "Fin d annee",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifie",
  ONGOING: "En cours",
  FINISHED: "Termine",
  CANCELLED: "Annule",
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-blue-500/10 text-blue-700",
  ONGOING: "bg-orange-500/10 text-orange-700",
  FINISHED: "bg-green-500/10 text-green-700",
  CANCELLED: "bg-gray-500/10 text-gray-700",
};

export function ExamsListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useExams({ page, limit: 20 });

  const exams = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Examens
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {meta?.total || 0} examen(s)
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Aucun examen</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Sessions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam: any) => (
                    <tr key={exam.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{exam.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {TYPE_LABELS[exam.type] || exam.type}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[exam.status]}`}>
                          {STATUS_LABELS[exam.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {exam._count?.sessions || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/exams/${exam.id}`}>
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
