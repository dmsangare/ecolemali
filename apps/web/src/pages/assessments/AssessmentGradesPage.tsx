import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Lock, CheckCircle2, Send } from "lucide-react";
import {
  useAssessment,
  useAssessmentGrades,
  useSaveGrades,
  useUpdateAssessmentStatus,
} from "@/hooks/assessments";
import { initials } from "@/lib/formatters";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
} from "@/components/ui";

export function AssessmentGradesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: assessment, isLoading: loadingA } = useAssessment(id);
  const { data, isLoading: loadingG } = useAssessmentGrades(id);
  const saveGrades = useSaveGrades();
  const updateStatus = useUpdateAssessmentStatus();

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.grades) {
      const initial: Record<string, string> = {};
      data.grades.forEach((g) => {
        initial[g.studentId] = g.grade?.value !== null && g.grade?.value !== undefined
          ? String(g.grade.value)
          : "";
      });
      setValues(initial);
    }
  }, [data]);

  if (loadingA || loadingG || !assessment || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEditable = assessment.status === "OPEN" || assessment.status === "DRAFT";
  const isLocked = assessment.status === "LOCKED" || assessment.status === "VALIDATED";

  const handleChange = (studentId: string, value: string) => {
    setValues((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSave = async () => {
    const grades = Object.entries(values).map(([studentId, value]) => ({
      studentId,
      value: value === "" ? null : Number(value),
    }));
    await saveGrades.mutateAsync({ assessmentId: id!, grades });
  };

  const handleStatus = async (action: "open" | "submit" | "validate" | "lock") => {
    await updateStatus.mutateAsync({ id: id!, action });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/grades">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {assessment.class?.name} — {assessment.subject?.name} — Coefficient {assessment.coefficient} — Max {assessment.maxScore}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {assessment.status === "DRAFT" && (
            <Button onClick={() => handleStatus("open")} variant="secondary">
              Ouvrir la saisie
            </Button>
          )}
          {assessment.status === "OPEN" && (
            <Button onClick={() => handleStatus("submit")} variant="secondary">
              <Send className="h-4 w-4" />
              Soumettre
            </Button>
          )}
          {assessment.status === "SUBMITTED" && (
            <Button onClick={() => handleStatus("validate")} variant="secondary">
              <CheckCircle2 className="h-4 w-4" />
              Valider
            </Button>
          )}
          {assessment.status === "VALIDATED" && (
            <Button onClick={() => handleStatus("lock")} variant="secondary">
              <Lock className="h-4 w-4" />
              Verrouiller
            </Button>
          )}
          {isEditable && (
            <Button onClick={handleSave} disabled={saveGrades.isPending}>
              {saveGrades.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saisie des notes ({data.grades.length} eleves)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                  <th className="px-4 py-3">Eleve</th>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3 w-40">Note / {assessment.maxScore}</th>
                </tr>
              </thead>
              <tbody>
                {data.grades.map((g) => (
                  <tr key={g.studentId} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials(g.student.firstName, g.student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {g.student.lastName} {g.student.firstName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                      {g.student.matricule}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        max={assessment.maxScore}
                        step="0.5"
                        value={values[g.studentId] || ""}
                        onChange={(e) => handleChange(g.studentId, e.target.value)}
                        disabled={!isEditable}
                        className="w-32"
                        placeholder="—"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
