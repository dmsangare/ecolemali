import { useState, useMemo } from "react";
import {
  Plus, Layers, Loader2, Pencil, Trash2, Sparkles, X, Search,
} from "lucide-react";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import {
  useLevels, useCreateLevel, useUpdateLevel, useDeleteLevel,
} from "@/hooks/levels";
import type {
  Level, LevelCycle, StateExamType, CreateLevelInput,
} from "@/types/level";

const CYCLE_LABELS: Record<LevelCycle, string> = {
  PREMIER_CYCLE: "Premier cycle (1ere - 6eme annee)",
  DEUXIEME_CYCLE: "Deuxieme cycle (7eme - 9eme annee)",
};

const EXAM_LABELS: Record<StateExamType, string> = {
  NONE: "Aucun",
  CEP: "CEP",
  DEF: "DEF",
  BAC: "BAC",
};

// Niveaux standard du système educatif malien
const MALI_STANDARD_LEVELS: Omit<CreateLevelInput, "schoolId">[] = [
  { name: "1ere Annee", code: "1A", cycle: "PREMIER_CYCLE", orderIndex: 1 },
  { name: "2eme Annee", code: "2A", cycle: "PREMIER_CYCLE", orderIndex: 2 },
  { name: "3eme Annee", code: "3A", cycle: "PREMIER_CYCLE", orderIndex: 3 },
  { name: "4eme Annee", code: "4A", cycle: "PREMIER_CYCLE", orderIndex: 4 },
  { name: "5eme Annee", code: "5A", cycle: "PREMIER_CYCLE", orderIndex: 5 },
  { name: "6eme Annee", code: "6A", cycle: "PREMIER_CYCLE", orderIndex: 6, stateExamType: "CEP" },
  { name: "7eme Annee", code: "7A", cycle: "DEUXIEME_CYCLE", orderIndex: 7 },
  { name: "8eme Annee", code: "8A", cycle: "DEUXIEME_CYCLE", orderIndex: 8 },
  { name: "9eme Annee", code: "9A", cycle: "DEUXIEME_CYCLE", orderIndex: 9, stateExamType: "DEF" },
  { name: "10eme Annee", code: "10A", cycle: "DEUXIEME_CYCLE", orderIndex: 10 },
  { name: "11eme Annee", code: "11A", cycle: "DEUXIEME_CYCLE", orderIndex: 11 },
  { name: "12eme Annee", code: "12A", cycle: "DEUXIEME_CYCLE", orderIndex: 12, stateExamType: "BAC" },
];

export function LevelsListPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission("level:create");
  const canEdit = hasPermission("level:update");
  const canDelete = hasPermission("level:delete");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Level | null>(null);
  const [q, setQ] = useState("");

  const { data: levels, isLoading } = useLevels();
  const deleteMutation = useDeleteLevel();

  const filtered = useMemo(() => {
    const list = levels || [];
    const sorted = [...list].sort((a, b) => a.orderIndex - b.orderIndex);
    if (!q.trim()) return sorted;
    const needle = q.toLowerCase();
    return sorted.filter(
      (l) =>
        l.name.toLowerCase().includes(needle) ||
        l.code.toLowerCase().includes(needle),
    );
  }, [levels, q]);

  const premierCycle = filtered.filter((l) => l.cycle === "PREMIER_CYCLE");
  const deuxiemeCycle = filtered.filter((l) => l.cycle === "DEUXIEME_CYCLE");

  const handleDelete = (level: Level) => {
    if (
      confirm(
        `Supprimer le niveau "${level.name}" ?\n\nCette action est irreversible.`,
      )
    ) {
      deleteMutation.mutate(level.id);
    }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (level: Level) => {
    setEditing(level);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Niveaux
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerez les niveaux d'enseignement de votre etablissement
            (1ere année a la 12eme annee, ou personnalise).
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau niveau
          </Button>
        )}
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un niveau..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* EMPTY STATE */}
      {(!levels || levels.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <Layers className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <div>
              <h3 className="font-semibold">Aucun niveau configure</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Commencez par pre-remplir les niveaux standard du Mali, ou
                creez vos niveaux manuellement.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              {canCreate && (
                <>
                  <Button onClick={handleOpenCreate} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer manuellement
                  </Button>
                  <PrefillButton />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LISTE PREMIER CYCLE */}
      {premierCycle.length > 0 && (
        <CycleSection
          title={CYCLE_LABELS.PREMIER_CYCLE}
          levels={premierCycle}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {/* LISTE DEUXIEME CYCLE */}
      {deuxiemeCycle.length > 0 && (
        <CycleSection
          title={CYCLE_LABELS.DEUXIEME_CYCLE}
          levels={deuxiemeCycle}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {/* MODAL */}
      {modalOpen && (
        <LevelFormModal
          level={editing}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// PREFILL BUTTON
// ============================================================

function PrefillButton() {
  const { user } = useAuth();
  const createMutation = useCreateLevel();
  const [loading, setLoading] = useState(false);

  const handlePrefill = async () => {
    if (!user?.schoolId) {
      alert("Aucune ecole rattachee. Reconnectez-vous.");
      return;
    }
    if (
      !confirm(
        `Creer les ${MALI_STANDARD_LEVELS.length} niveaux standard du Mali ?\n\n` +
          `(1ere année a la 12eme annee, avec CEP/DEF/BAC)`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      for (const lvl of MALI_STANDARD_LEVELS) {
        await createMutation.mutateAsync({
          ...lvl,
          schoolId: user.schoolId,
        });
      }
    } catch (e) {
      // toast deja gere
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePrefill} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      Pre-remplir avec les niveaux du Mali
    </Button>
  );
}

// ============================================================
// CYCLE SECTION
// ============================================================

function CycleSection({
  title, levels, canEdit, canDelete, onEdit, onDelete,
}: {
  title: string;
  levels: Level[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (l: Level) => void;
  onDelete: (l: Level) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {levels.map((level) => (
            <div
              key={level.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary text-xs font-bold">
                  {level.code}
                </span>
                <div>
                  <p className="font-medium">{level.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Ordre : {level.orderIndex}
                    {level.stateExamType !== "NONE" && (
                      <> Â· Examen d'Etat : {EXAM_LABELS[level.stateExamType]}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(level)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(level)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MODAL FORM
// ============================================================

function LevelFormModal({
  level, onClose,
}: {
  level: Level | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isEdit = !!level;
  const createMutation = useCreateLevel();
  const updateMutation = useUpdateLevel();

  const [form, setForm] = useState<CreateLevelInput>({
    schoolId: user?.schoolId || "",
    cycle: level?.cycle || "PREMIER_CYCLE",
    name: level?.name || "",
    code: level?.code || "",
    stateExamType: level?.stateExamType || "NONE",
    orderIndex: level?.orderIndex || 1,
    isActive: level?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.code.trim()) {
      setError("Nom et code sont obligatoires.");
      return;
    }
    if (!isEdit && !user?.schoolId) {
      setError("Aucune ecole rattachee. Reconnectez-vous.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && level) {
        const { schoolId, ...rest } = form;
        await updateMutation.mutateAsync({ id: level.id, dto: rest });
      } else {
        await createMutation.mutateAsync(form);
      }
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isEdit ? "Modifier le niveau" : "Nouveau niveau"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isEdit
                  ? "Modifiez les informations du niveau"
                  : "Ajoutez un niveau d'enseignement"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Nom du niveau *</Label>
            <Input
              placeholder="Ex: 6eme Annee"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                placeholder="Ex: 6A"
                className="font-mono uppercase"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ordre</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.orderIndex}
                onChange={(e) =>
                  setForm({ ...form, orderIndex: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cycle *</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.cycle}
              onChange={(e) =>
                setForm({ ...form, cycle: e.target.value as LevelCycle })
              }
            >
              <option value="PREMIER_CYCLE">{CYCLE_LABELS.PREMIER_CYCLE}</option>
              <option value="DEUXIEME_CYCLE">{CYCLE_LABELS.DEUXIEME_CYCLE}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Examen d'Etat</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.stateExamType}
              onChange={(e) =>
                setForm({
                  ...form,
                  stateExamType: e.target.value as StateExamType,
                })
              }
            >
              <option value="NONE">Aucun</option>
              <option value="CEP">CEP (fin 6eme annee)</option>
              <option value="DEF">DEF (fin 9eme annee)</option>
              <option value="BAC">BAC (fin 12eme annee)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer" : "Creer le niveau"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
