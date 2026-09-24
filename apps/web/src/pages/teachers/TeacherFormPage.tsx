import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateTeacher, useTeacher } from "@/hooks/teachers";
import { teachersApi } from "@/api/teachers";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Input, Card, CardContent } from "@/components/ui";
import type { CreateTeacherInput } from "@/types/teacher";

export function TeacherFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: teacherData } = useTeacher(id);
  const createMutation = useCreateTeacher();

  const [form, setForm] = useState<CreateTeacherInput>({
    schoolId: "",
    firstName: "",
    lastName: "",
    gender: undefined,
    phone: "",
    email: "",
    address: "",
    specialty: "",
    diploma: "",
    hireDate: "",
    status: "ACTIVE",
    contractType: "PERMANENT",
  });

  useEffect(() => {
    if (teacherData) {
      const t: any = teacherData;
      setForm({
        schoolId: t.schoolId,
        firstName: t.firstName || "",
        lastName: t.lastName || "",
        gender: t.gender || undefined,
        phone: t.phone || "",
        email: t.email || "",
        address: t.address || "",
        specialty: t.specialty || "",
        diploma: t.diploma || "",
        hireDate: t.hireDate ? t.hireDate.slice(0, 10) : "",
        status: t.status || "ACTIVE",
        contractType: t.contractType || "PERMANENT",
      });
    }
  }, [teacherData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      toast.error("Nom et prénom obligatoires");
      return;
    }

    try {
      if (isEdit) {
        await teachersApi.update(id!, form);
        toast.success("Enseignant mis à jour");
        qc.invalidateQueries({ queryKey: ["teachers"] });
        navigate("/teachers");
      } else {
        await createMutation.mutateAsync(form);
        navigate("/teachers");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/teachers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Modifier enseignant" : "Nouvel enseignant"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Prénom *</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Moussa"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nom *</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Coulibaly"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Genre</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.gender || ""}
                  onChange={(e) =>
                    setForm({ ...form, gender: (e.target.value || undefined) as any })
                  }
                >
                  <option value="">—</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Téléphone</label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+223 XX XX XX XX"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Date d'embauche</label>
                <Input
                  type="date"
                  value={form.hireDate || ""}
                  onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Spécialité</label>
                <Input
                  value={form.specialty || ""}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Mathématiques"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Diplôme</label>
                <Input
                  value={form.diploma || ""}
                  onChange={(e) => setForm({ ...form, diploma: e.target.value })}
                  placeholder="Master, Licence…"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type de contrat</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.contractType || "PERMANENT"}
                  onChange={(e) => setForm({ ...form, contractType: e.target.value as any })}
                >
                  <option value="PERMANENT">Permanent</option>
                  <option value="CONTRACT">Contractuel</option>
                  <option value="TEMPORARY">Temporaire</option>
                  <option value="VOLUNTEER">Bénévole</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Statut</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.status || "ACTIVE"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="SUSPENDED">Suspendu</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-muted-foreground">Adresse</label>
                <Input
                  value={form.address || ""}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link to="/teachers">
                <Button type="button" variant="outline">Annuler</Button>
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
