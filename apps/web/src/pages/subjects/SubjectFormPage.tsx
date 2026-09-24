import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCreateSubject, useSubject } from "@/hooks/subjects";
import { subjectsApi } from "@/api/subjects";
import { Button, Input, Card, CardContent } from "@/components/ui";
import type { CreateSubjectInput } from "@/types/subject";

const TYPE_OPTIONS = [
  { value: "CORE", label: "Obligatoire" },
  { value: "OPTIONAL", label: "Optionnelle" },
  { value: "SPORT", label: "Sport" },
  { value: "ART", label: "Art" },
] as const;

export function SubjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: subjectData } = useSubject(id);
  const createMutation = useCreateSubject();

  const [form, setForm] = useState<CreateSubjectInput>({
    code: "",
    name: "",
    type: "CORE",
    isActive: true,
  });

  useEffect(() => {
    if (subjectData) {
      const s: any = subjectData;
      setForm({
        code: s.code || "",
        name: s.name || "",
        type: s.type || "CORE",
        isActive: s.isActive ?? true,
      });
    }
  }, [subjectData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      toast.error("Code et nom obligatoires");
      return;
    }

    try {
      if (isEdit) {
        await subjectsApi.update(id!, form);
        toast.success("Matière mise à jour");
        qc.invalidateQueries({ queryKey: ["subjects"] });
        navigate("/subjects");
      } else {
        await createMutation.mutateAsync(form);
        navigate("/subjects");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/subjects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Modifier la matière" : "Nouvelle matière"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Code *</label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="MATH, FR, HG…"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nom *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mathématiques"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.type || "CORE"}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as any })
                  }
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={form.isActive ?? true}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link to="/subjects">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="h-4 w-4" />
                {isEdit ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
