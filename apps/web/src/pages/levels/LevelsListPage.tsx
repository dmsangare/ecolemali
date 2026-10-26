import { useState, useMemo } from "react";
import {
  Plus, Layers, Loader2, Pencil, Trash2, Sparkles, X, Search,
} from "lucide-react";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
  PageLoader, EmptyState,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import {
  useLevels, useCreateLevel, useUpdateLevel, useDeleteLevel,
} from "@/hooks/levels";
import type {
  Level, LevelCycle, StateExamType, CreateLevelInput,
} from "@/types/level";

const CYCLE_LABELS: Record<LevelCycle, string> = {
  PREMIER_CYCLE: "Premier cycle (1ère – 6ème année)",
  DEUXIEME_CYCLE: "Deuxième cycle (7ème – 9ème année)",
};

const EXAM_LABELS: Record<StateExamType, string> = {
  NONE: "Aucun",
  CEP: "CEP",
  DEF: "DEF",
  BAC: "BAC",
};

const MALI_STANDARD_LEVELS: Omit<CreateLevelInput, "schoolId">[] = [
  { name: "1ère Année", code: "1A", cycle: "PREMIER_CYCLE", orderIndex: 1 },
  { name: "2ème Année", code: "2A", cycle: "PREMIER_CYCLE", orderIndex: 2 },
  { name: "3ème Année", code: "3A", cycle: "PREMIER_CYCLE", orderIndex: 3 },
  { name: "4ème Année", code: "4A", cycle: "PREMIER_CYCLE", orderIndex: 4 },
  { name: "5ème Année", code: "5A", cycle: "PREMIER_CYCLE", orderIndex: 5 },
  { name: "6ème Année", code: "6A", cycle: "PREMIER_CYCLE", orderIndex: 6, stateExamType: "CEP" },
  { name: "7ème Année", code: "7A", cycle: "DEUXIEME_CYCLE", orderIndex: 7 },
  { name: "8ème Année", code: "8A", cycle: "DEUXIEME_CYCLE", orderIndex: 8 },
  { name: "9ème Année", code: "9A", cycle: "DEUXIEME_CYCLE", orderIndex: 9, stateExamType: "DEF" },
  { name: "10ème Année", code: "10A", cycle: "DEUXIEME_CYCLE", orderIndex: 10 },
  { name: "11ème Année", code: "11A", cycle: "DEUXIEME_CYCLE", orderIndex: 11 },
  { name: "12ème Année", code: "12A", cycle: "DEUXIEME_CYCLE", orderIndex: 12, stateExamType: "BAC" },
];

export function LevelsListPage() {
  const { hasPermission } = useAuth();
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
        `Supprimer le niveau "${level.name}" ?\n\nCette action est irréversible.`,
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
    return <PageLoader label="Chargement des niveaux..." />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sis-md bg-sis-brand-50 text-sis-brand mt-0.5 dark:bg-sis-brand-900/30 dark:text-sis-brand-300">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Niveaux</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les niveaux d'enseignement de votre établissement
              (1ère à 12ème année, ou personnalisé).
            </p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau niveau
          </Button>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un niveau..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
        />
      </div>

      {/* EMPTY STATE */}
      {(!levels || levels.length === 0) && (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title="Aucun niveau configuré"
          description="Commencez par pré-remplir les niveaux standard du Mali, ou créez vos niveaux manuellement."
          action={
            canCreate ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={handleOpenCreate} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer manuellement
                </Button>
                <PrefillButton />
              </div>
            ) : undefined
          }
        />
      )}

      {/* LISTE PREMIER CYCLE */}
      {premierCycle.length > 0 && (
        <CycleSection
          title={CYCLE_LABELS.PREMIER_CYCLE}
          accent="brand"
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
          accent="info"
          levels={deuxiemeCycle}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {/* MODAL */}
      {modalOpen && (
        <LevelFormModal level={editing} onClose={() => setModalOpen(false)} />
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
      alert("Aucune école rattachée. Reconnectez-vous.");
      return;
    }
    if (
      !confirm(
        `Créer les ${MALI_STANDARD_LEVELS.length} niveaux standard du Mali ?\n\n` +
          `(1ère année à la 12ème année, avec CEP/DEF/BAC)`,
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
      // toast déjà géré
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePrefill} disabled={loading} className="bg-sis-brand hover:bg-sis-brand-600 text-sis-brand-foreground">
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      Pré-remplir avec les niveaux du Mali
    </Button>
  );
}

// ============================================================
// CYCLE SECTION
// ============================================================
function CycleSection({
  title, accent, levels, canEdit, canDelete, onEdit, onDelete,
}: {
  title: string;
  accent: "brand" | "info";
  levels: Level[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (l: Level) => void;
  onDelete: (l: Level) => void;
}) {
  const accentClasses =
    accent === "brand"
      ? "bg-sis-brand-50 text-sis-brand dark:bg-sis-brand-900/30 dark:text-sis-brand-300"
      : "bg-sis-info-bg text-sis-info dark:bg-sis-info-bg/30 dark:text-sis-info";
  const headerColor =
    accent === "brand" ? "text-sis-brand" : "text-sis-info";

  return (
    <Card className="rounded-sis-lg border-sis-neutral-200 shadow-sis-sm dark:border-sis-neutral-800">
      <CardHeader className="border-b">
        <CardTitle className={`text-base ${headerColor} flex items-center gap-2`}>
          <Layers className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-sis-neutral-200 dark:divide-sis-neutral-800">
          {levels.map((level) => (
            <div
              key={level.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-sis-neutral-50/70 transition dark:hover:bg-sis-neutral-900/40"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-sis-sm text-xs font-bold ${accentClasses}`}>
                  {level.code}
                </span>
                <div>
                  <p className="font-medium">{level.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Ordre : {level.orderIndex}
                    {level.stateExamType !== "NONE" && (
                      <> · Examen d'État : {EXAM_LABELS[level.stateExamType]}</>
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
                  <Button variant="ghost" size="icon" onClick={() => onDelete(level)}>
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
// MODAL FORM (déjà patchée par le script précédent)
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
      setError("Aucune école rattachée. Reconnectez-vous.");
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-sis-lg shadow-2xl relative z-[10000] max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-sis-md bg-sis-brand-50 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5 text-sis-brand" />
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
            <div className="rounded-sis-md border border-sis-danger-border bg-sis-danger-bg p-3 text-sm text-sis-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Nom du niveau *</Label>
            <Input
              placeholder="Ex: 6ème Année"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-sis-md focus:ring-sis-brand/30 focus:border-sis-brand"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                placeholder="Ex: 6A"
                className="font-mono uppercase rounded-sis-md focus:ring-sis-brand/30 focus:border-sis-brand"
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
                className="rounded-sis-md focus:ring-sis-brand/30 focus:border-sis-brand"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cycle *</Label>
            <select
              className="w-full h-10 rounded-sis-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand"
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
            <Label>Examen d'État</Label>
            <select
              className="w-full h-10 rounded-sis-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-sis-brand/30 focus:border-sis-brand"
              value={form.stateExamType}
              onChange={(e) =>
                setForm({
                  ...form,
                  stateExamType: e.target.value as StateExamType,
                })
              }
            >
              <option value="NONE">Aucun</option>
              <option value="CEP">CEP (fin 6ème année)</option>
              <option value="DEF">DEF (fin 9ème année)</option>
              <option value="BAC">BAC (fin 12ème année)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-sis-brand hover:bg-sis-brand-600 text-sis-brand-foreground">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer le niveau"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}