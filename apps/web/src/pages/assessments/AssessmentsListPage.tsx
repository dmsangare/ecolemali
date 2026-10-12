import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Loader2,
  Eye,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Search,
  MoreVertical,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAssessments, useUpdateAssessmentStatus } from "@/hooks/assessments";
import { useClasses, useLevels } from "@/hooks/classes";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { formatDate } from "@/lib/formatters";
import { CreateAssessmentModal } from "./components/CreateAssessmentModal";
import { useAuth } from "@/contexts/AuthContext";

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  INTERROGATION: { label: "Interrogation", emoji: "âšª", color: "bg-gray-500/10 text-gray-700 border-gray-300" },
  DEVOIR: { label: "Devoir", emoji: "🔵", color: "bg-blue-500/10 text-blue-700 border-blue-300" },
  CONTROLE: { label: "Controle", emoji: "🟣", color: "bg-purple-500/10 text-purple-700 border-purple-300" },
  COMPOSITION: { label: "Composition", emoji: "🟠", color: "bg-orange-500/10 text-orange-700 border-orange-300" },
  EXAMEN: { label: "Examen", emoji: "🔴", color: "bg-red-500/10 text-red-700 border-red-300" },
  TP: { label: "TP", emoji: "🟢", color: "bg-green-500/10 text-green-700 border-green-300" },
  ORAL: { label: "Oral", emoji: "🟡", color: "bg-yellow-500/10 text-yellow-700 border-yellow-300" },
  PROJET: { label: "Projet", emoji: "🔷", color: "bg-cyan-500/10 text-cyan-700 border-cyan-300" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-500/10 text-gray-700" },
  OPEN: { label: "Ouverte", color: "bg-blue-500/10 text-blue-700" },
  SUBMITTED: { label: "Soumise", color: "bg-orange-500/10 text-orange-700" },
  VALIDATED: { label: "Validee", color: "bg-green-500/10 text-green-700" },
  LOCKED: { label: "Verrouillee", color: "bg-purple-500/10 text-purple-700" },
};

export function AssessmentsListPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("assessment:create");
  const canManage = hasPermission("assessment:update");
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: classes } = useClasses();
  const { data: levels } = useLevels();

  const { data: terms } = useQuery({
    queryKey: ["terms", "list"],
    queryFn: async () => {
      const { data } = await api.get("/terms");
      return data.data || data;
    },
    staleTime: 10 * 60_000,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", "list"],
    queryFn: async () => {
      const { data } = await api.get("/subjects");
      return data.data || data;
    },
    staleTime: 10 * 60_000,
  });

  // Filtres envoyes au backend
  const filters: any = {};
  if (classId) filters.classId = classId;
  if (termId) filters.termId = termId;
  if (subjectId) filters.subjectId = subjectId;

  const { data, isLoading } = useAssessments(filters);

  // Les donnees peuvent etre {data: [], meta: {}} ou directement []
  const rawList = Array.isArray(data) ? data : data?.data || [];
  const allAssessments = Array.isArray(rawList) ? rawList : [];

  // Filtre texte cote frontend
  const assessments = useMemo(() => {
    if (!search.trim()) return allAssessments;
    const q = search.toLowerCase();
    return allAssessments.filter((a: any) =>
      a.title?.toLowerCase().includes(q),
    );
  }, [allAssessments, search]);

  // Stats
  const totalAssessments = assessments.length;
  const totalGrades = assessments.reduce(
    (sum: number, a: any) => sum + (a._count?.grades || 0),
    0,
  );

  // Classes triees
  const sortedClasses = useMemo(() => {
    if (!classes || !levels) return [];
    return [...classes].sort((a, b) => {
      const la = levels.find((l) => l.id === a.levelId)?.orderIndex ?? 999;
      const lb = levels.find((l) => l.id === b.levelId)?.orderIndex ?? 999;
      if (la !== lb) return la - lb;
      return a.code.localeCompare(b.code);
    });
  }, [classes, levels]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Notes & Evaluations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalAssessments} evaluation(s) Â· {totalGrades} note(s) saisie(s)
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle evaluation
          </Button>
        )}
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">🏫 Toutes les classes</option>
          {sortedClasses.map((c) => {
            const level = levels?.find((l) => l.id === c.levelId);
            const emoji = level?.cycle === "PREMIER_CYCLE" ? "📗" : "📘";
            return (
              <option key={c.id} value={c.id}>
                {emoji} {c.name}
              </option>
            );
          })}
        </select>

        <select
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">📅 Tous les trimestres</option>
          {terms?.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">📚 Toutes les matieres</option>
          {subjects?.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un titre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* CONTENU */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucune evaluation trouvee</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {classId || termId || subjectId
                ? "Essayez de modifier les filtres"
                : "Creez votre premiere evaluation"}
            </p>
            {canCreate && (
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle evaluation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Titre</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-center p-3 font-medium">Bareme</th>
                    <th className="text-center p-3 font-medium">Coef</th>
                    <th className="text-center p-3 font-medium">Notes</th>
                    <th className="text-center p-3 font-medium">Statut</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a: any) => (
                    <AssessmentRow key={a.id} assessment={a} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODALE */}
      {createOpen && <CreateAssessmentModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

// ============================================================
// Row component
// ============================================================
function AssessmentRow({ assessment }: { assessment: any }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("assessment:update");
  const typeInfo = TYPE_LABELS[assessment.type] || TYPE_LABELS.DEVOIR;
  const statusInfo = STATUS_LABELS[assessment.status] || STATUS_LABELS.DRAFT;
  const gradeCount = assessment._count?.grades || 0;
  const classSize = assessment._count?.enrollments || assessment.class?.capacity || 40;
  const fillRate = classSize > 0 ? (gradeCount / classSize) * 100 : 0;

  const isLocked = assessment.status === "LOCKED";
  const canEdit = assessment.status === "DRAFT";
  const canLock = assessment.status === "VALIDATED";
  const canGrade = ["OPEN", "SUBMITTED"].includes(assessment.status);

  const statusMutation = useUpdateAssessmentStatus();

  const handleLock = async (action: "lock" | "reopen") => {
    await statusMutation.mutateAsync({ id: assessment.id, action });
  };

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="p-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium",
            typeInfo.color,
          )}
        >
          <span>{typeInfo.emoji}</span>
          {typeInfo.label}
        </span>
      </td>
      <td className="p-3 font-medium">{assessment.title}</td>
      <td className="p-3 text-muted-foreground">
        {assessment.date ? formatDate(assessment.date) : "—"}
      </td>
      <td className="p-3 text-center font-mono">
        /{Number(assessment.maxScore).toFixed(0)}
      </td>
      <td className="p-3 text-center font-mono">{assessment.coefficient}</td>
      <td className="p-3">
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                fillRate >= 90
                  ? "bg-green-500"
                  : fillRate >= 50
                    ? "bg-blue-500"
                    : "bg-orange-500",
              )}
              style={{ width: `${Math.min(fillRate, 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {gradeCount}/{classSize}
          </span>
        </div>
      </td>
      <td className="p-3 text-center">
        <span
          className={cn(
            "inline-block px-2 py-0.5 rounded text-xs font-medium",
            statusInfo.color,
          )}
        >
          {statusInfo.label}
        </span>
      </td>
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {canGrade && (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/assessments/${assessment.id}/grades`}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Saisir
              </Link>
            </Button>
          )}
          {!canGrade && (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/assessments/${assessment.id}/grades`}>
                <Eye className="h-3.5 w-3.5 mr-1" />
                Voir
              </Link>
            </Button>
          )}
          {canManage && canLock && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLock("lock")}
              disabled={statusMutation.isPending}
            >
              <Lock className="h-3.5 w-3.5" />
            </Button>
          )}
          {canManage && isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLock("reopen")}
              disabled={statusMutation.isPending}
            >
              <Unlock className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
