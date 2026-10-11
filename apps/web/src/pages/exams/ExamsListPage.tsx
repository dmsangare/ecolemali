import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Loader2, Eye, Plus, Filter, X, Calendar, TrendingUp, Award } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { examsApi } from "@/api/exams";
import { api } from "@/lib/axios";
import { useExams } from "@/hooks/exams";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/formatters";
import { Button, Input, Card, CardContent } from "@/components/ui";

const TYPE_LABELS: Record<string, string> = {
  INTERNE: "Interne",
  COMPOSITION: "Composition",
  BLANC: "Examen blanc",
  FIN_ANNEE: "Fin d'année",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifié",
  ONGOING: "En cours",
  FINISHED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-orange-100 text-orange-700",
  FINISHED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export function ExamsListPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: "", status: "", academicYearId: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "COMPOSITION",
    academicYearId: "",
    termId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  });

  const { data, isLoading } = useExams({ page, limit: 20, ...filters });

  const { data: years } = useQuery({
    queryKey: ["exams", "years"],
    queryFn: async () => (await api.get("/teachers/academic-years")).data?.data ?? [],
  });

  const createMut = useMutation({
    mutationFn: (dto: any) => examsApi.create(dto),
    onSuccess: () => {
      toast.success("Examen créé");
      qc.invalidateQueries({ queryKey: ["exams"] });
      setShowCreate(false);
      setForm({ name: "", type: "COMPOSITION", academicYearId: "", termId: "", startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur"),
  });

  const exams = data?.data ?? data?.items ?? [];
  const meta = data?.meta;

  // Stats sur la page courante
  const stats = exams.reduce(
    (acc: any, e: any) => {
      acc.total++;
      if (e.status === "ONGOING") acc.ongoing++;
      if (e.status === "FINISHED") acc.finished++;
      acc.sessions += e._count?.sessions ?? 0;
      return acc;
    },
    { total: 0, ongoing: 0, finished: 0, sessions: 0 }
  );

  const submit = () => {
    if (!form.name || !form.academicYearId || !form.startDate || !form.endDate) {
      return toast.error("Tous les champs obligatoires doivent être remplis");
    }
    createMut.mutate({
      schoolId: user?.schoolId,
      name: form.name,
      type: form.type,
      academicYearId: form.academicYearId,
      termId: form.termId || null,
      startDate: form.startDate,
      endDate: form.endDate,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6" /> Examens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total ?? exams.length} examen(s) enregistré(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" /> Filtres
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouvel examen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total examens</p>
              <p className="text-xl font-bold">{meta?.total ?? stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En cours</p>
              <p className="text-xl font-bold text-orange-600">{stats.ongoing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Terminés</p>
              <p className="text-xl font-bold text-green-600">{stats.finished}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions (page)</p>
              <p className="text-xl font-bold">{stats.sessions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Tous</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Statut</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tous</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <Button variant="ghost" onClick={() => setFilters({ type: "", status: "", academicYearId: "" })}>
              <X className="h-4 w-4 mr-1" /> Réinitialiser
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun examen enregistré</p>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Créer le premier examen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Période</th>
                    <th className="px-4 py-3 text-center">Sessions</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e: any) => (
                    <tr key={e.id} className="border-b hover:bg-muted/30 transition">
                      <td className="px-4 py-3 font-medium">{e.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                          {TYPE_LABELS[e.type] ?? e.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(e.startDate)} â†’ {formatDate(e.endDate)}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {e._count?.sessions ?? e.sessions?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                          {STATUS_LABELS[e.status] ?? e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/exams/${e.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" /> Voir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale création */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="bg-white w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Nouvel examen</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="text-sm text-gray-600">Nom *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Composition 1er trimestre 2026" />
            </div>

            <div>
              <label className="text-sm text-gray-600">Type *</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Année scolaire *</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.academicYearId}
                onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
              >
                <option value="">â€” Choisir â€”</option>
                {(years ?? []).map((y: any) => (
                  <option key={y.id} value={y.id}>
                    {y.label} {y.isCurrent ? "(actuelle)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Date début *</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Date fin *</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button onClick={submit} disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Créer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
