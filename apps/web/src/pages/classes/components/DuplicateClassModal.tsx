import { useState, useMemo } from "react";
import { X, Copy, Loader2, Info } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useCreateClass, useClasses } from "@/hooks/classes";
import type { ClassItem } from "@/types/class";

interface DuplicateClassModalProps {
  sourceClass: ClassItem;
  onClose: () => void;
}

export function DuplicateClassModal({
  sourceClass,
  onClose,
}: DuplicateClassModalProps) {
  const [name, setName] = useState(() => {
    // Suggérer un nom : 9ème A -> 9ème B
    const match = sourceClass.name.match(/^(.+?)\s+([A-Z])$/);
    if (match) {
      const nextLetter = String.fromCharCode(match[2].charCodeAt(0) + 1);
      return `${match[1]} ${nextLetter}`;
    }
    return `${sourceClass.name} (copie)`;
  });

  const [code, setCode] = useState(() => {
    const match = sourceClass.code.match(/^(\d+)([A-Z])$/);
    if (match) {
      const nextLetter = String.fromCharCode(match[2].charCodeAt(0) + 1);
      return `${match[1]}${nextLetter}`;
    }
    return `${sourceClass.code}-2`;
  });

  const [copyRoom, setCopyRoom] = useState(false);
  const [copyTeacher, setCopyTeacher] = useState(false);

  const createMutation = useCreateClass();
  const { data: allClasses } = useClasses();

  const cycle = sourceClass.level?.cycle;

  // Vérifier si le code existe déjà
  const codeExists = useMemo(() => {
    if (!allClasses) return false;
    return allClasses.some(
      (c) =>
        c.academicYearId === sourceClass.academicYearId &&
        c.code.toUpperCase() === code.toUpperCase(),
    );
  }, [allClasses, code, sourceClass.academicYearId]);

  const formValid =
    name.trim() && code.trim() && !codeExists && name !== sourceClass.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    const input: any = {
      academicYearId: sourceClass.academicYearId,
      levelId: sourceClass.levelId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      capacity: sourceClass.capacity || 50,
    };

    // Optionnels : copier seulement si demande
    if (copyRoom && sourceClass.roomId) input.roomId = sourceClass.roomId;
    if (copyTeacher && sourceClass.mainTeacherId)
      input.mainTeacherId = sourceClass.mainTeacherId;

    try {
      await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // erreur geree par le hook
    }
  };

  const isFirstCycle = cycle === "PREMIER_CYCLE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isFirstCycle
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Copy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Dupliquer la classe</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Cree une copie de <strong>{sourceClass.name}</strong>
                </p>
              </div>
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
          <div className="p-6 space-y-4">
            {/* NOM + CODE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nouveau nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Nouveau code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 font-mono uppercase"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Avertissement code */}
            {codeExists && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded p-2">
                ⚠️ Le code <strong>{code}</strong> existe deja pour cette
                année scolaire.
              </div>
            )}

            {/* INFOS COPIEES */}
            <div className="bg-muted/50 rounded-md p-3 border space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">
                Sera copie automatiquement
              </p>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Niveau :</span>
                  <span className="font-medium">{sourceClass.level?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Capacite :</span>
                  <span className="font-medium">{sourceClass.capacity || 50}</span>
                </div>
              </div>
            </div>

            {/* OPTIONS COPIE */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Options de copie</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyRoom}
                  onChange={(e) => setCopyRoom(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">
                  Copier la salle ({sourceClass.room?.name || "aucune"})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyTeacher}
                  onChange={(e) => setCopyTeacher(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">
                  Copier le titulaire (
                  {sourceClass.mainTeacher
                    ? `${sourceClass.mainTeacher.firstName} ${sourceClass.mainTeacher.lastName}`
                    : "aucun"}
                  )
                </span>
              </label>
            </div>

            {/* INFO */}
            <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Les <strong>élèves ne seront pas copies</strong>. La nouvelle
                classe sera vide.
              </span>
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
              className={
                isFirstCycle
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Dupliquer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
