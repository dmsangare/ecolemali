import { useState, useMemo } from "react";
import { CreditCard, Loader2, Search, Users, CheckSquare, Square, Sparkles } from "lucide-react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useStudents } from "@/hooks/students";
import { useClasses, useLevels } from "@/hooks/classes";
import { GenerateIdCardsModal } from "./components/GenerateIdCardsModal";
import type { Student } from "@/types/student";

export function IdCardsPage() {
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"selection" | "class">("selection");

  const { data: studentsData, isLoading } = useStudents({ limit: 200 });
  const { data: classes } = useClasses();
  const { data: levels } = useLevels();

  const students: Student[] = useMemo(() => {
    if (!studentsData) return [];
    return Array.isArray(studentsData) ? studentsData : (studentsData as any).data || [];
  }, [studentsData]);

  // Filtrer par classe et recherche
  const filtered = useMemo(() => {
    let list = students;
    if (classId) {
      list = list.filter((s: any) =>
        s.enrollments?.some((e: any) => e.classId === classId && e.status === "VALIDATED")
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s: any) => {
        const name = `${s.lastName} ${s.firstName}`.toLowerCase();
        return name.includes(q) || (s.matricule || "").toLowerCase().includes(q);
      });
    }
    return list;
  }, [students, classId, search]);

  // Normalisation : l'API peut renvoyer un array ou { data: [...] }
  const rawClasses: any = classes;
  const classesList: any[] = Array.isArray(rawClasses)
    ? rawClasses
    : rawClasses?.data || [];

  const rawLevels: any = levels;
  const levelsList: any[] = Array.isArray(rawLevels)
    ? rawLevels
    : rawLevels?.data || [];

  // Classes triees
  const sortedClasses = useMemo(() => {
    if (classesList.length === 0) return [];
    return [...classesList].sort((a: any, b: any) => {
      const la = levelsList.find((l: any) => l.id === a.levelId)?.orderIndex ?? 999;
      const lb = levelsList.find((l: any) => l.id === b.levelId)?.orderIndex ?? 999;
      if (la !== lb) return la - lb;
      return (a.code || "").localeCompare(b.code || "");
    });
  }, [classesList, levelsList]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((s: any) => s.id));
    }
  };

  const handleGenerateSelection = () => {
    if (selectedIds.length === 0) return;
    setModalMode("selection");
    setModalOpen(true);
  };

  const handleGenerateClass = () => {
    if (!classId) return;
    setModalMode("class");
    setModalOpen(true);
  };

  // Pour la modal
  const modalPayload = modalMode === "selection"
    ? { studentIds: selectedIds }
    : { classId };
  const modalCount = modalMode === "selection" ? selectedIds.length : filtered.length;
  const modalLabel = modalMode === "selection"
    ? `${selectedIds.length} eleve(s) selectionne(s)`
    : `Toute la classe (${filtered.length} eleve(s))`;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Cartes scolaires
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generez les cartes d'identite des élèves avec QR code anti-fraude.
          </p>
        </div>
      </div>

      {/* FILTRES */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSelectedIds([]);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Toutes les classes</option>
              {sortedClasses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un élève (nom, matricule)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {filtered.length} eleve(s) affiche(s)
              {selectedIds.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {selectedIds.length} selectionne(s)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {classId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateClass}
                  disabled={filtered.length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Toute la classe ({filtered.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleGenerateSelection}
                disabled={selectedIds.length === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Cartes de la selection ({selectedIds.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLEAU */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Aucun élève trouve.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="p-3 w-10">
                      <button onClick={toggleSelectAll} className="p-1">
                        {selectedIds.length === filtered.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Élève</th>
                    <th className="text-left p-3 font-medium">Matricule</th>
                    <th className="text-left p-3 font-medium">Classe</th>
                    <th className="text-left p-3 font-medium">Carte generee</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => {
                    const currentEnr = s.enrollments?.find((e: any) => e.status === "VALIDATED");
                    const isSelected = selectedIds.includes(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={cn(
                          "border-b last:border-0 hover:bg-muted/30 cursor-pointer",
                          isSelected && "bg-primary/5",
                        )}
                        onClick={() => toggleSelect(s.id)}
                      >
                        <td className="p-3">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          {s.lastName.toUpperCase()} {s.firstName}
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {s.matricule}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {currentEnr?.class?.name || "-"}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {s.idCardGeneratedAt
                            ? new Date(s.idCardGeneratedAt).toLocaleDateString("fr-FR")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL */}
      {modalOpen && (
        <GenerateIdCardsModal
          payload={modalPayload}
          label={modalLabel}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
