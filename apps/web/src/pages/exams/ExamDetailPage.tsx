import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, GraduationCap } from "lucide-react";
import { useExam } from "@/hooks/exams";
import { formatDate } from "@/lib/formatters";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: exam, isLoading, error } = useExam(id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Examen introuvable</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/exams")}>
              Retour a la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/exams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            {exam.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessions ({exam.sessions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!exam.sessions || exam.sessions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Aucune session pour cet examen
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Matiere</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Candidats</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.sessions.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{formatDate(s.date)}</td>
                      <td className="px-4 py-3 text-sm">{s.subject.name}</td>
                      <td className="px-4 py-3 text-sm">{s.class.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {s._count?.candidates || 0}
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
