import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Loader2,
  Eye,
  Search,
  Award,
  FileDown,
  CheckCircle2,
  Send,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useReportCards,
  usePublishReportCard,
  useValidateReportCard,
} from "@/hooks/report-cards";
import { useClasses, useLevels } from "@/hooks/classes";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  STATUS_LABELS,
  DECISION_LABELS,
  getAppreciation,
  getAppreciationColor,
} from "@/types/report-cards";
import type { ReportCard } from "@/types/report-cards";
import { GenerateReportCardsModal } from "./components/GenerateReportCardsModal";
import { PublishClassModal } from "./components/PublishClassModal";
import { useAuth } from "@/contexts/AuthContext";

export function ReportCardsListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:create");
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [search, setSearch] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

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

  // Filtres backend
  const filters: any = {};
  if (classId) filters.classId = classId;
  if (termId) filters.termId = termId;

  const { data, isLoading } = useReportCards(filters);

  const allReports = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any).data || [];
  }, [data]);

  // Filtre texte cote frontend
  const reports = useMemo(() => {
    if (!search.trim()) return allReports;
    const q = search.toLowerCase();
    return allReports.filter((r: ReportCard) => {
      const name = `${r.student?.lastName || ""} ${r.student?.firstName || ""}`;
      const matricule = r.student?.matricule || "";
      return name.toLowerCase().includes(q) || matricule.toLowerCase().includes(q);
    });
  }, [allReports, search]);

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

  // Stats globales
  const totalCount = reports.length;
  const publishedCount = reports.filter(
    (r: ReportCard) => r.status === "PUBLISHED",
  ).length;
  const draftCount = reports.filter(
    (r: ReportCard) => r.status === "DRAFT",
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Bulletins
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} bulletin(s) · {draftCount} brouillon(s) ·{" "}
            {publishedCount} publié(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="outline" onClick={() => setPublishOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Publier une classe
            </Button>
          )}
          {canManage && (
            <Button onClick={() => setGenerateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Générer les bulletins
            </Button>
          )}
        </div>
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un élève (nom, matricule)..."
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
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucun bulletin trouve</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {classId || termId
                ? "Essayez de modifier les filtres"
                : "Generez vos premiers bulletins"}
            </p>
            {canManage && (
              <Button onClick={() => setGenerateOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Générer les bulletins
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
                    <th className="text-left p-3 font-medium">Élève</th>
                    <th className="text-left p-3 font-medium">Classe</th>
                    <th className="text-left p-3 font-medium">Trimestre</th>
                    <th className="text-center p-3 font-medium">Moyenne</th>
                    <th className="text-center p-3 font-medium">Rang</th>
                    <th className="text-left p-3 font-medium">Appreciation</th>
                    <th className="text-center p-3 font-medium">Statut</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r: ReportCard) => (
                    <ReportCardRow key={r.id} report={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODALES */}
      {generateOpen && (
        <GenerateReportCardsModal onClose={() => setGenerateOpen(false)} />
      )}
      {publishOpen && (
        <PublishClassModal onClose={() => setPublishOpen(false)} />
      )}
    </div>
  );
}

// ============================================================
// Ligne
// ============================================================
function ReportCardRow({ report }: { report: ReportCard }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:update");
  const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.DRAFT;
  const scale = report.scale ?? 20;
  const appreciation = getAppreciation(report.average, scale);
  const appreciationColor = getAppreciationColor(report.average, scale);

  const validateMutation = useValidateReportCard();
  const publishMutation = usePublishReportCard();

  const handleValidate = async () => {
    await validateMutation.mutateAsync(report.id);
  };

  const handlePublish = async () => {
    await publishMutation.mutateAsync(report.id);
  };

  const fullName = report.student
    ? `${report.student.lastName} ${report.student.firstName}`
    : "—";

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="p-3">
        <div className="flex items-center gap-2">
          {report.student?.gender && (
            <span
              className={cn(
                "inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold shrink-0",
                report.student.gender === "M"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-pink-100 text-pink-700",
              )}
            >
              {report.student.firstName[0]}
              {report.student.lastName[0]}
            </span>
          )}
          <div>
            <div className="font-medium">{fullName}</div>
            {report.student?.matricule && (
              <div className="text-xs text-muted-foreground font-mono">
                {report.student.matricule}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-3 text-muted-foreground">
        {report.class?.name || "—"}
      </td>
      <td className="p-3 text-muted-foreground">{report.term?.name || "—"}</td>
      <td className="p-3 text-center">
        {report.average !== null && report.average !== undefined ? (
          <span className={cn("font-bold text-base", appreciationColor)}>
            {Number(report.average).toFixed(2)}
            <span className="text-xs font-normal text-muted-foreground"> / {scale}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3 text-center">
        {report.rank ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
              report.rank === 1
                ? "bg-yellow-100 text-yellow-800"
                : report.rank === 2
                  ? "bg-gray-100 text-gray-700"
                  : report.rank === 3
                    ? "bg-orange-100 text-orange-700"
                    : "bg-muted text-muted-foreground",
            )}
          >
            {report.rank === 1 && "🥇"}
            {report.rank === 2 && "🥈"}
            {report.rank === 3 && "🥉"}
            {report.rank}/{report.classSize || "?"}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3">
        <span className={cn("text-sm font-medium", appreciationColor)}>
          {appreciation}
        </span>
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
          <Button asChild variant="ghost" size="sm">
            <Link to={`/report-cards/${report.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              Voir
            </Link>
          </Button>
          {canManage && report.status === "DRAFT" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleValidate}
              disabled={validateMutation.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {canManage && report.status === "VALIDATED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="text-green-600 hover:text-green-700"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}