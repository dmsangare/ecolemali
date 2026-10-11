import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar, ArrowLeft, Plus, Pencil, Trash2, Loader2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { adminReportsApi, type AdminReportDeadline } from "@/api/admin-reports";
import { academicYearsApi } from "@/api/academic-years";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABELS: Record<string, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  PASSEE: "Passée",
  TRANSMISE: "Transmise",
};

const STATUS_COLORS: Record<string, string> = {
  A_VENIR: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-amber-100 text-amber-800",
  PASSEE: "bg-red-100 text-red-800",
  TRANSMISE: "bg-green-100 text-green-800",
};

const TEMPLATES = [
  "RAP-02",
  "RAP-03",
  "RAP-04",
  "RAP-05",
  "RAP-06",
  "RAP-07",
  "RAP-08",
];

interface FormState {
  id?: string;
  templateCode: string;
  title: string;
  academicYearId: string;
  recipient: string;
  prepareFrom: string;
  deadline: string;
  source: string;
  confidenceLevel: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  templateCode: "RAP-02",
  title: "",
  academicYearId: "",
  recipient: "",
  prepareFrom: "",
  deadline: "",
  source: "",
  confidenceLevel: "A_CONFIRMER",
  status: "A_VENIR",
};

export function AdminReportsDeadlinesPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("report_card:update");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState<string>("");

  // --- Queries ---
  const yearsQ = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: () => academicYearsApi.list(),
  });

  const deadlinesQ = useQuery({
    queryKey: ["admin-reports", "deadlines"],
    queryFn: () => adminReportsApi.listDeadlines(),
  });

  const years = yearsQ.data ?? [];
  const allDeadlines = deadlinesQ.data ?? [];
  const currentYear = years.find((y) => y.isCurrent);

  const deadlines = filterStatus
    ? allDeadlines.filter((d) => d.status === filterStatus)
    : allDeadlines;

  // --- Mutations ---
  const saveMut = useMutation({
    mutationFn: async (payload: FormState) => {
      const body: any = {
        templateCode: payload.templateCode,
        title: payload.title,
        recipient: payload.recipient || undefined,
        prepareFrom: payload.prepareFrom || undefined,
        deadline: payload.deadline,
        source: payload.source || undefined,
        confidenceLevel: payload.confidenceLevel,
        status: payload.status,
        academicYearId: payload.academicYearId || undefined,
      };
      if (payload.id) {
        return adminReportsApi.patchDeadline(payload.id, body);
      }
      return adminReportsApi.createDeadline(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports", "deadlines"] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminReportsApi.deleteDeadline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports", "deadlines"] });
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "Erreur"),
  });

  // --- Handlers ---
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      academicYearId: currentYear?.id ?? "",
    });
    setModalOpen(true);
  };

  const openEdit = (d: AdminReportDeadline) => {
    setForm({
      id: d.id,
      templateCode: d.templateCode,
      title: d.title,
      academicYearId: d.academicYearId ?? "",
      recipient: d.recipient ?? "",
      prepareFrom: d.prepareFrom ? d.prepareFrom.slice(0, 10) : "",
      deadline: d.deadline ? d.deadline.slice(0, 10) : "",
      source: d.source ?? "",
      confidenceLevel: d.confidenceLevel ?? "A_CONFIRMER",
      status: d.status ?? "A_VENIR",
    });
    setModalOpen(true);
  };

  const handleDelete = (d: AdminReportDeadline) => {
    if (confirm(`Supprimer l'échéance "${d.title}" ?`)) {
      deleteMut.mutate(d.id);
    }
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin-reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Calendar className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendrier des échéances</h1>
            <p className="text-sm text-muted-foreground">
              Suivi des dates limites administratives
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle échéance
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[
          { v: "", l: "Toutes" },
          { v: "A_VENIR", l: "À venir" },
          { v: "EN_COURS", l: "En cours" },
          { v: "PASSEE", l: "Passées" },
          { v: "TRANSMISE", l: "Transmises" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilterStatus(f.v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              filterStatus === f.v
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {deadlines.length} échéance{deadlines.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deadlinesQ.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement…</div>
          ) : deadlines.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune échéance enregistrée.
              </p>
              {canManage && (
                <Button onClick={openCreate} variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première échéance
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Code</th>
                    <th className="text-left p-2 font-medium">Titre</th>
                    <th className="text-left p-2 font-medium">Destinataire</th>
                    <th className="text-left p-2 font-medium">Échéance</th>
                    <th className="text-left p-2 font-medium">Statut</th>
                    <th className="text-right p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deadlines.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">{d.templateCode}</td>
                      <td className="p-2 font-medium">{d.title}</td>
                      <td className="p-2 text-muted-foreground">{d.recipient ?? "—"}</td>
                      <td className="p-2">
                        {new Date(d.deadline).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            STATUS_COLORS[d.status ?? "A_VENIR"] ?? "bg-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[d.status ?? "A_VENIR"] ?? d.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(d)}
                              aria-label="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(d)}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Create/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Modifier l'échéance" : "Nouvelle échéance"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.title || !form.deadline}
            >
              {saveMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="d-code">Code du rapport *</Label>
            <select
              id="d-code"
              value={form.templateCode}
              onChange={(e) => setForm({ ...form, templateCode: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-title">Titre *</Label>
            <Input
              id="d-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Rapport de rentrée 2026-2027"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-recipient">Destinataire</Label>
            <Input
              id="d-recipient"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              placeholder="Ex: CAP Bamako Rive Droite"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="d-prepare">Début de préparation</Label>
              <Input
                id="d-prepare"
                type="date"
                value={form.prepareFrom}
                onChange={(e) => setForm({ ...form, prepareFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-deadline">Échéance *</Label>
              <Input
                id="d-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-source">Source (référence)</Label>
            <Input
              id="d-source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Ex: Note de service n°123/MEN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-status">Statut</Label>
            <select
              id="d-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="A_VENIR">À venir</option>
              <option value="EN_COURS">En cours</option>
              <option value="PASSEE">Passée</option>
              <option value="TRANSMISE">Transmise</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
