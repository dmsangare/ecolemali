import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { GraduationCap, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/axios";
import { academicYearsApi } from "@/api/academic-years";
import { useAuth } from "@/contexts/AuthContext";

const unwrap = (res: any) => res.data?.data ?? res.data;

const stateExamDossiersApi = {
  listSessions: async (academicYearId?: string) => {
    const res = await api.get("/state-exam-dossiers/sessions", {
      params: { academicYearId },
    });
    return unwrap(res) as any[];
  },
  getSession: async (id: string) => {
    const res = await api.get(`/state-exam-dossiers/sessions/${id}`);
    return unwrap(res);
  },
  createSession: async (body: any) => {
    const res = await api.post("/state-exam-dossiers/sessions", body);
    return unwrap(res);
  },
  generateDossiers: async (id: string, body?: any) => {
    const res = await api.post(
      `/state-exam-dossiers/sessions/${id}/generate-dossiers`,
      body ?? {},
    );
    return unwrap(res);
  },
};

export function StateExamSessionsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:create");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    examType: "DEF",
    label: "",
    academicYearId: "",
    registrationOpens: "",
    registrationCloses: "",
    examDate: "",
    institutionTarget: "",
  });

  const yearsQ = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: () => academicYearsApi.list(),
  });

  const sessionsQ = useQuery({
    queryKey: ["state-exam-dossiers", "sessions"],
    queryFn: () => stateExamDossiersApi.listSessions(),
  });

  const years = yearsQ.data ?? [];
  const sessions = sessionsQ.data ?? [];
  const currentYear = years.find((y) => y.isCurrent);

  const createMut = useMutation({
    mutationFn: () =>
      stateExamDossiersApi.createSession({
        academicYearId: form.academicYearId,
        examType: form.examType,
        label: form.label,
        registrationOpens: form.registrationOpens || undefined,
        registrationCloses: form.registrationCloses || undefined,
        examDate: form.examDate || undefined,
        institutionTarget: form.institutionTarget || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state-exam-dossiers"] });
      setModalOpen(false);
      setForm({
        examType: "DEF",
        label: "",
        academicYearId: "",
        registrationOpens: "",
        registrationCloses: "",
        examDate: "",
        institutionTarget: "",
      });
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const openCreate = () => {
    setForm({
      examType: "DEF",
      label: "DEF 2026",
      academicYearId: currentYear?.id ?? "",
      registrationOpens: "",
      registrationCloses: "",
      examDate: "",
      institutionTarget: "",
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dossiers d'examens d'État
            </h1>
            <p className="text-sm text-muted-foreground">
              Sessions DEF et BAC — préparation des dossiers candidats
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle session
          </Button>
        )}
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Une session par type et par année</p>
            <p className="mt-1 text-blue-800">
              Créez une session DEF ou BAC pour l'année en cours, puis générez les
              dossiers par classe.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {sessions.length} session{sessions.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsQ.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement…</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune session créée.
              </p>
              {canManage && (
                <Button onClick={openCreate} variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première session
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Libellé</th>
                    <th className="text-left p-2 font-medium">Année</th>
                    <th className="text-left p-2 font-medium">Examen</th>
                    <th className="text-center p-2 font-medium">Dossiers</th>
                    <th className="text-right p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            s.examType === "DEF"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {s.examType}
                        </span>
                      </td>
                      <td className="p-2 font-medium">{s.label}</td>
                      <td className="p-2 text-muted-foreground">
                        {s.academicYear
                          ? `${new Date(s.academicYear.startDate).getFullYear()}-${new Date(s.academicYear.endDate).getFullYear()}`
                          : "—"}
                      </td>
                      <td className="p-2">
                        {s.examDate
                          ? new Date(s.examDate).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="p-2 text-center">{s._count?.dossiers ?? 0}</td>
                      <td className="p-2 text-right">
                        <Link to={`/state-exam-dossiers/sessions/${s.id}`}>
                          <Button variant="ghost" size="sm">Ouvrir</Button>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle session d'examen"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !form.label || !form.academicYearId}
            >
              {createMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création…
                </>
              ) : (
                "Créer la session"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s-type">Type d'examen *</Label>
            <select
              id="s-type"
              value={form.examType}
              onChange={(e) => setForm({ ...form, examType: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="DEF">DEF (9ème année)</option>
              <option value="BAC">BAC (12ème année)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-label">Libellé *</Label>
            <Input
              id="s-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ex: DEF 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-year">Année scolaire *</Label>
            <select
              id="s-year"
              value={form.academicYearId}
              onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">-- Sélectionner --</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {new Date(y.startDate).getFullYear()}-
                  {new Date(y.endDate).getFullYear()}
                  {y.isCurrent ? " (en cours)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="s-open">Ouverture inscr.</Label>
              <Input
                id="s-open"
                type="date"
                value={form.registrationOpens}
                onChange={(e) => setForm({ ...form, registrationOpens: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-close">Clôture inscr.</Label>
              <Input
                id="s-close"
                type="date"
                value={form.registrationCloses}
                onChange={(e) => setForm({ ...form, registrationCloses: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-exam">Date d'examen</Label>
            <Input
              id="s-exam"
              type="date"
              value={form.examDate}
              onChange={(e) => setForm({ ...form, examDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-target">Institution destinataire</Label>
            <Input
              id="s-target"
              value={form.institutionTarget}
              onChange={(e) => setForm({ ...form, institutionTarget: e.target.value })}
              placeholder="Ex: CAP Bamako Rive Droite"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
