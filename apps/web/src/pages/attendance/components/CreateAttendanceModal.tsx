import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";
import { useCreateAttendance } from "@/hooks/attendance";
import { Button, Input, Card } from "@/components/ui";
import { toast } from "sonner";

export function CreateAttendanceModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createMut = useCreateAttendance();
  const [form, setForm] = useState({
    classId: "",
    subjectId: "",
    teacherId: "",
    termId: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "08:00",
    endTime: "09:00",
  });

  const { data: classes } = useQuery({
    queryKey: ["classes", "list"],
    queryFn: async () => (await api.get("/classes")).data?.data ?? [],
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", "list"],
    queryFn: async () => (await api.get("/subjects")).data?.data ?? [],
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers", "list"],
    queryFn: async () => (await api.get("/teachers", { params: { limit: 100 } })).data?.data ?? [],
  });

  // Trimestre en cours (auto-sélectionné)
  const { data: currentTerm } = useQuery({
    queryKey: ["terms", "current"],
    queryFn: async () => {
      try {
        const res = await api.get("/terms/current");
        return res.data?.data ?? res.data;
      } catch {
        return null;
      }
    },
  });

  // Liste complète des trimestres
  const { data: terms } = useQuery({
    queryKey: ["terms", "list"],
    queryFn: async () => (await api.get("/terms")).data?.data ?? [],
  });

  // Auto-sélection du trimestre courant
  useEffect(() => {
    if (currentTerm?.id && !form.termId) {
      setForm((f) => ({ ...f, termId: currentTerm.id }));
    }
  }, [currentTerm]);

  const { data: students } = useQuery({
    queryKey: ["students", "by-class", form.classId],
    queryFn: async () => {
      if (!form.classId) return [];
      try {
        const res = await api.get("/students", { params: { classId: form.classId, limit: 200 } });
        return res.data?.data ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!form.classId,
  });

  const submit = () => {
    if (!form.classId || !form.teacherId || !form.termId) {
      return toast.error("Classe, enseignant et trimestre obligatoires");
    }

    if (!students || students.length === 0) {
      return toast.error("Aucun élève dans cette classe");
    }

    const records = (students ?? []).map((s: any) => ({
      studentId: s.id,
      status: "PRESENT" as const,
    }));

    const dto = {
      classId: form.classId,
      subjectId: form.subjectId || null,
      teacherId: form.teacherId,
      termId: form.termId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      records,
    };

    createMut.mutate(dto, {
      onSuccess: (created: any) => {
        onClose();
        if (created?.id) navigate(`/attendance/${created.id}`);
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="bg-white w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Nouvelle session de présence</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        {!currentTerm && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-700">
            ⚠️ Aucun trimestre actif. Configure-les dans <strong>Paramètres → Années scolaires</strong>.
          </div>
        )}

        <div>
          <label className="text-sm text-gray-600">Classe *</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
          >
            <option value="">— Choisir —</option>
            {classes?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Matière</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          >
            <option value="">— Aucune —</option>
            {subjects?.map((s: any) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Enseignant *</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          >
            <option value="">— Choisir —</option>
            {teachers?.map((t: any) => (
              <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Trimestre *</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.termId}
            onChange={(e) => setForm({ ...form, termId: e.target.value })}
          >
            <option value="">— Choisir —</option>
            {terms?.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} {currentTerm?.id === t.id ? "(en cours)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Début</label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Fin</label>
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>

        {form.classId && (
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
            {students?.length ?? 0} élève(s) seront marqués <strong>présents</strong> par défaut.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={createMut.isPending || !currentTerm}>
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Créer la session
          </Button>
        </div>
      </Card>
    </div>
  );
}
