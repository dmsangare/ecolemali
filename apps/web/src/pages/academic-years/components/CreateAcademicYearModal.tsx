import { useState, useEffect } from "react";
import { X, Loader2, Save, Calendar, Info } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useCreateAcademicYear } from "@/hooks/academic-years";
import { useSchool } from "@/hooks/school/useSchool";

interface CreateAcademicYearModalProps {
  onClose: () => void;
}

/**
 * Genere un libelle "YYYY-YYYY" pour une année scolaire.
 */
function suggestLabel(baseYear: number): string {
  const y1 = baseYear;
  const y2 = baseYear + 1;
  return `${y1}-${y2}`;
}

/**
 * Genere les dates proposees : 1er octobre -> 30 juin (+1 an).
 * Conforme au calendrier scolaire malien.
 */
function suggestDates(baseYear: number) {
  const start = `${baseYear}-10-01`;
  const end = `${baseYear + 1}-06-30`;
  return { start, end };
}

export function CreateAcademicYearModal({ onClose }: CreateAcademicYearModalProps) {
  const { data: school } = useSchool();
  const createMutation = useCreateAcademicYear();

  // Année suggeree par defaut : année suivante de l'annee civile en cours
  const currentYear = new Date().getFullYear();
  const defaultLabel = suggestLabel(currentYear);
  const defaultDates = suggestDates(currentYear);

  const [label, setLabel] = useState(defaultLabel);
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [isCurrent, setIsCurrent] = useState(false);

  // Auto-sync : quand le libelle change (ex: 2027-2028), on adapte les dates
  useEffect(() => {
    const match = label.match(/^(\d{4})-\d{4}$/);
    if (match) {
      const y = parseInt(match[1], 10);
      const dates = suggestDates(y);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  }, [label]);

  const isValid =
    label.trim().length > 0 &&
    startDate &&
    endDate &&
    new Date(startDate) < new Date(endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await createMutation.mutateAsync({
        schoolId: school?.id,
        label: label.trim(),
        startDate,
        endDate,
        isCurrent,
      });
      onClose();
    } catch {
      // erreur geree par le hook
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
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Nouvelle année scolaire
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Elle sera creee en statut "En preparation"
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
          <div className="p-6 space-y-5">
            {/* INFO */}
            <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/50 p-3">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Calendrier scolaire malien : du <strong>1er octobre</strong> au{" "}
                <strong>30 juin</strong>. Vous pourrez ajuster les dates apres creation.
              </p>
            </div>

            {/* LIBELLE */}
            <div>
              <Label htmlFor="label">Libelle *</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: 2027-2028"
                className="mt-1 font-mono"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format recommande : AAAA-AAAA
              </p>
            </div>

            {/* DATES */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Debut *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* ANNEE COURANTE */}
            <div className="flex items-start gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                id="isCurrent"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                disabled={createMutation.isPending}
                className="h-4 w-4 mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="isCurrent" className="cursor-pointer">
                  Marquer comme année courante
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  L'annee courante est utilisee par defaut dans le tableau de bord et les formulaires.
                  Si une autre année est deja courante, elle sera automatiquement desactivee.
                </p>
              </div>
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
              disabled={!isValid || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Créer l'annee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
