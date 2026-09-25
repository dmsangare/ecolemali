import { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Users,
  MapPin,
  UserCircle2,
  Calendar,
} from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useCreateClass,
  useLevels,
  useRooms,
  useTeachers,
  useAcademicYears,
} from "@/hooks/classes";
import type { LevelCycle, CreateClassInput } from "@/types/class";

interface CreateClassModalProps {
  defaultCycle?: LevelCycle;
  onClose: () => void;
}

export function CreateClassModal({
  defaultCycle = "PREMIER_CYCLE",
  onClose,
}: CreateClassModalProps) {
  // --- State du formulaire ---
  const [cycle, setCycle] = useState<LevelCycle>(defaultCycle);
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [levelId, setLevelId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [roomId, setRoomId] = useState<string>("");
  const [capacity, setCapacity] = useState<number>(50);
  const [mainTeacherId, setMainTeacherId] = useState<string>("");

  // --- Data hooks ---
  const { data: levels, isLoading: levelsLoading } = useLevels(cycle);
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: academicYears, isLoading: yearsLoading } = useAcademicYears();
  const createMutation = useCreateClass();

  // --- Année courante par défaut ---
  useEffect(() => {
    if (academicYears && academicYears.length > 0 && !academicYearId) {
      const current = academicYears.find((y) => y.isCurrent) || academicYears[0];
      setAcademicYearId(current.id);
    }
  }, [academicYears, academicYearId]);

  // --- Reset niveau si changement de cycle ---
  useEffect(() => {
    setLevelId("");
  }, [cycle]);

  // --- Auto-génération : nom -> code ---
  useEffect(() => {
    if (codeManuallyEdited) return;
    if (!name.trim()) {
      setCode("");
      return;
    }
    // Extraire le 1er chiffre ET la derniere lettre
    // Ex: "1ère A" -> "1A", "9ème B" -> "9B", "1A" -> "1A"
    const numMatch = name.match(/\d+/);
    const letterMatch = name.match(/[A-Za-z](?=\s*$)/);
    const num = numMatch ? numMatch[0] : "";
    const letter = letterMatch ? letterMatch[0].toUpperCase() : "";
    if (num) {
      setCode(`${num}${letter}`);
    }
  }, [name, codeManuallyEdited]);

  // --- Auto-génération : code -> nom (si nom vide) ---
  useEffect(() => {
    if (name.trim()) return;
    if (!code.trim()) return;
    // Ex: "1A" -> "1ère A", "9B" -> "9ème B"
    const match = code.match(/^(\d+)([A-Za-z])?$/);
    if (match) {
      const num = match[1];
      const letter = match[2] ? ` ${match[2].toUpperCase()}` : "";
      const suffix = num === "1" ? "ère" : "ème";
      setName(`${num}${suffix}${letter}`);
    }
  }, [code, name]);

  // --- Validation ---
  const isFirstCycle = cycle === "PREMIER_CYCLE";
  // Prof principal désormais facultatif pour tous les cycles
  const teacherRequired = false;
  const teacherMissing = false;

  const formValid =
    academicYearId &&
    levelId &&
    name.trim() &&
    code.trim() &&
    capacity > 0 &&
    !teacherMissing;

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    const input: CreateClassInput = {
      academicYearId,
      levelId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      capacity,
      roomId: roomId || null,
      mainTeacherId: mainTeacherId || null,
    };

    try {
      await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // erreur geree par le hook
    }
  };

  // --- Detecter si un prof est specialise (2eme cycle) ---
  const isSpecialist = (specialty?: string | null): boolean => {
    if (!specialty) return false;
    const s = specialty.toLowerCase();
    return (
      s.includes("math") ||
      s.includes("physique") ||
      s.includes("chimie") ||
      s.includes("francais") ||
      s.includes("français") ||
      s.includes("anglais") ||
      s.includes("histoire") ||
      s.includes("geo") ||
      s.includes("svt") ||
      s.includes("biologie") ||
      s.includes("science") ||
      s.includes("arabe")
    );
  };

  // --- Prof selectionne est un specialiste du 2eme cycle ? ---
  const selectedTeacher = teachers?.find((t) => t.id === mainTeacherId);
  const selectedIsSpecialist = selectedTeacher
    ? isSpecialist(selectedTeacher.specialty)
    : false;
  const showSpecialistWarning =
    isFirstCycle && selectedIsSpecialist && !!mainTeacherId;

  // --- Tri des niveaux / salles / profs ---
  const sortedLevels = useMemo(() => {
    if (!levels) return [];
    return [...levels].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [levels]);

  const sortedRooms = useMemo(() => {
    if (!rooms) return [];
    return [...rooms].sort((a, b) => a.name.localeCompare(b.name));
  }, [rooms]);

  const sortedTeachers = useMemo(() => {
    if (!teachers) return [];
    return [...teachers].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
      ),
    );
  }, [teachers]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">Nouvelle classe</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Creez une classe pour l annee scolaire en cours
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* CORPS */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* ANNEE SCOLAIRE */}
            <div>
              <Label htmlFor="academicYear" className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Annee scolaire
              </Label>
              {yearsLoading ? (
                <div className="h-10 rounded-md bg-muted animate-pulse mt-1" />
              ) : (
                <select
                  id="academicYear"
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">-- Selectionner --</option>
                  {academicYears?.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label} {y.isCurrent ? "(en cours)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* CYCLE */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                Cycle
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCycle("PREMIER_CYCLE")}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all",
                    cycle === "PREMIER_CYCLE"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-input hover:border-emerald-200",
                  )}
                >
                  <span className="font-medium text-sm">
                    📗 Premier cycle
                  </span>
                  <span className="text-xs text-muted-foreground">
                    1ère → 6ème année
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCycle("DEUXIEME_CYCLE")}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all",
                    cycle === "DEUXIEME_CYCLE"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-input hover:border-blue-200",
                  )}
                >
                  <span className="font-medium text-sm">
                    📘 Deuxième cycle
                  </span>
                  <span className="text-xs text-muted-foreground">
                    7ème → 9ème année
                  </span>
                </button>
              </div>
            </div>

            {/* NIVEAU */}
            <div>
              <Label htmlFor="level">Niveau</Label>
              {levelsLoading ? (
                <div className="h-10 rounded-md bg-muted animate-pulse mt-1" />
              ) : (
                <select
                  id="level"
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">-- Selectionner --</option>
                  {sortedLevels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* NOM + CODE (grille) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nom de la classe</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: 1ère A"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tapez le nom, le code se genere automatiquement
                </p>
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setCodeManuallyEdited(true);
                  }}
                  placeholder="1A"
                  className="mt-1 font-mono uppercase"
                  maxLength={10}
                  required
                />
                {codeManuallyEdited && (
                  <button
                    type="button"
                    onClick={() => setCodeManuallyEdited(false)}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Re-generer auto
                  </button>
                )}
              </div>
            </div>

            {/* SALLE + CAPACITE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Salle (optionnel)
                </Label>
                {roomsLoading ? (
                  <div className="h-10 rounded-md bg-muted animate-pulse mt-1" />
                ) : (
                  <select
                    id="room"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">-- Aucune --</option>
                    {sortedRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <Label htmlFor="capacity" className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Capacite max
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={200}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value) || 0)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* TITULAIRE */}
            <div>
              <Label
                htmlFor="teacher"
                className="flex items-center gap-2 flex-wrap"
              >
                <UserCircle2 className="h-3.5 w-3.5" />
                Professeur principal
                {teacherRequired && (
                  <span className="text-xs text-destructive font-semibold">
                    * Obligatoire (1er cycle)
                  </span>
                )}
                {!teacherRequired && (
                  <span className="text-xs text-muted-foreground">
                    (optionnel en 2eme cycle)
                  </span>
                )}
              </Label>
              {teachersLoading ? (
                <div className="h-10 rounded-md bg-muted animate-pulse mt-1" />
              ) : (
                <select
                  id="teacher"
                  value={mainTeacherId}
                  onChange={(e) => setMainTeacherId(e.target.value)}
                  className={cn(
                    "mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm",
                    teacherMissing
                      ? "border-destructive"
                      : "border-input",
                  )}
                >
                  <option value="">-- Selectionner --</option>
                  {sortedTeachers.map((t) => {
                    const isSpec = isSpecialist(t.specialty);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.lastName} {t.firstName}
                        {t.specialty ? ` — ${t.specialty}` : ""}
                        {isSpec ? " [2e cycle]" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
              {teacherMissing && (
                <div className="flex items-start gap-2 mt-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded p-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Le professeur principal est <strong>obligatoire</strong>{" "}
                    pour les classes du premier cycle.
                  </span>
                </div>
              )}
              {showSpecialistWarning && (
                <div className="flex items-start gap-2 mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 rounded p-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Ce professeur est <strong>specialise</strong> (2eme cycle). Pour un premier cycle, preferez un <strong>instituteur polyvalent</strong>. Vous pouvez continuer si necessaire.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!formValid || createMutation.isPending}
              className={cn(
                isFirstCycle
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700",
              )}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Creer la classe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
