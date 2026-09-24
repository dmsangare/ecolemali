import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, GraduationCap, Plus, Trash2, X, Save, Users, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { examsApi } from "@/api/exams";
import { api } from "@/lib/axios";
import { useExam } from "@/hooks/exams";
import { formatDate } from "@/lib/formatters";
import { Button, Input, Card, CardContent } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifié",
  ONGOING: "En cours",
  FINISHED: "Terminé",
  CANCELLED: "Annulé",
};

const TYPE_LABELS: Record<string, string> = {
  INTERNE: "Interne",
  COMPOSITION: "Composition",
  BLANC: "Examen blanc",
  FIN_ANNEE: "Fin d'année",
};

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: exam, isLoading } = useExam(id);

  const [showAddSession, setShowAddSession] = useState(false);
  const [form, setForm] = useState({
    subjectId: "",
    classId: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "08:00",
    endTime: "10:00",
  });

  const { data: subjects } = useQuery({
    queryKey: ["exams", "subjects"],
    queryFn: async () => (await api.get("/subjects")).data?.data ?? [],
  });

  const { data: classes } = useQuery({
    queryKey: ["exams", "classes"],
    queryFn: async () => (await api.get("/classes")).data?.data ?? [],
  });

  const createSessionMut = useMutation({
    mutationFn: (dto: any) => examsApi.createSession(id!, dto),
    onSuccess: () => {
      toast.success("Session ajoutée");
      qc.invalidateQueries({ queryKey: ["exams", "detail", id] });
      setShowAddSession(false);
      setForm({ subjectId: "", classId: "", date: new Date().toISOString().slice(0, 10), startTime: "08:00", endTime: "10:00" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur"),
  });

  const deleteSessionMut = useMutation({
    mutationFn: (sessionId: string) => examsApi.removeSession(sessionId),
    onSuccess: () => {
      toast.success("Session supprimée");
      qc.invalidateQueries({ queryKey: ["exams", "detail", id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur"),
  });

  const updateStatusMut = useMutation({
    mutationFn: (status: string) => examsApi.updateStatus(id!, status),
    onSuccess: () => {
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["exams", "detail", id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur"),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Examen introuvable</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/exams")}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const e: any = exam;
  const sessions = e.sessions ?? [];

  const submitSession = () => {
    if (!form.subjectId || !form.classId) {
      return toast.error("Matière et classe obligatoires");
    }
    createSessionMut.mutate(form);
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/exams">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6" /> {e.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {TYPE_LABELS[e.type] ?? e.type} · {formatDate(e.startDate)} → {formatDate(e.endDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={e.status}
            onChange={(ev) => updateStatusMut.mutate(ev.target.value)}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-xl font-bold">{sessions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Matières</p>
              <p className="text-xl font-bold">
                {new Set(sessions.map((s: any) => s.subject?.id)).size}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Classes</p>
              <p className="text-xl font-bold">
                {new Set(sessions.map((s: any) => s.class?.id)).size}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Candidats</p>
              <p className="text-xl font-bold">
                {sessions.reduce((sum: number, s: any) => sum + (s._count?.candidates ?? 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Sessions d'examen</h2>
            <Button onClick={() => setShowAddSession(!showAddSession)}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter une session
            </Button>
          </div>

          {showAddSession && (
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Matière *</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.subjectId}
                    onChange={(ev) => setForm({ ...form, subjectId: ev.target.value })}
                  >
                    <option value="">— Choisir —</option>
                    {(subjects ?? []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Classe *</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.classId}
                    onChange={(ev) => setForm({ ...form, classId: ev.target.value })}
                  >
                    <option value="">— Choisir —</option>
                    {(classes ?? []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date</label>
                  <Input type="date" value={form.date} onChange={(ev) => setForm({ ...form, date: ev.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Début</label>
                    <Input type="time" value={form.startTime} onChange={(ev) => setForm({ ...form, startTime: ev.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fin</label>
                    <Input type="time" value={form.endTime} onChange={(ev) => setForm({ ...form, endTime: ev.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddSession(false)}>Annuler</Button>
                <Button onClick={submitSession} disabled={createSessionMut.isPending}>
                  Ajouter
                </Button>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 border-b">
              <tr>
                <th className="p-2">Matière</th>
                <th className="p-2">Classe</th>
                <th className="p-2">Date</th>
                <th className="p-2">Horaire</th>
                <th className="p-2 text-center">Candidats</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s: any) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2 font-medium">{s.subject?.name ?? "—"}</td>
                  <td className="p-2">{s.class?.name ?? "—"}</td>
                  <td className="p-2">{formatDate(s.date)}</td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {s.startTime?.slice(11, 16) ?? "—"} → {s.endTime?.slice(11, 16) ?? "—"}
                  </td>
                  <td className="p-2 text-center">{s._count?.candidates ?? 0}</td>
                  <td className="p-2 text-right">
                    <button
                      className="p-1.5 hover:bg-red-50 rounded text-red-600"
                      onClick={() => {
                        if (confirm("Supprimer cette session ?")) deleteSessionMut.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!sessions.length && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    Aucune session. Clique sur « Ajouter une session » pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
