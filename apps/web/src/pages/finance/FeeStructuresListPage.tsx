import { useState, useMemo } from "react";
import {
  Coins,
  Loader2,
  Save,
  Copy,
  Info,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  useFeeTypes,
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
} from "@/hooks/finance";
import { useLevels } from "@/hooks/classes";
import {
  FEE_CATEGORY_LABELS,
  formatFCFA,
  type FeeType,
  type FeeStructure,
} from "@/types/finance";

interface AcademicYear {
  id: string;
  label: string;
  isCurrent: boolean;
}

export function FeeStructuresListPage() {
  const [academicYearId, setAcademicYearId] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return (data.data || data) as AcademicYear[];
    },
    staleTime: 10 * 60_000,
  });

  // Année courante par defaut
  if (academicYears && !academicYearId) {
    const cur = academicYears.find((y) => y.isCurrent) || academicYears[0];
    if (cur) setAcademicYearId(cur.id);
  }

  const { data: feeTypes } = useFeeTypes();
  const { data: levels } = useLevels();
  const { data: structures, isLoading } = useFeeStructures(
    academicYearId ? { academicYearId } : {},
  );

  const createMutation = useCreateFeeStructure();
  const updateMutation = useUpdateFeeStructure();

  // Types actifs uniquement
  const activeTypes = useMemo(() => {
    if (!feeTypes) return [];
    const list = Array.isArray(feeTypes) ? feeTypes : (feeTypes as any).data || [];
    return list.filter((ft: FeeType) => ft.isActive);
  }, [feeTypes]);

  // Niveaux tries
  const sortedLevels = useMemo(() => {
    if (!levels) return [];
    return [...levels].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [levels]);

  // Map des structures : cle = `${levelId}_${feeTypeId}` -> structure
  const structureMap = useMemo(() => {
    const map = new Map<string, FeeStructure>();
    const list = structures
      ? Array.isArray(structures)
        ? structures
        : (structures as any).data || []
      : [];
    list.forEach((s: FeeStructure) => {
      if (s.levelId) map.set(`${s.levelId}_${s.feeTypeId}`, s);
    });
    return map;
  }, [structures]);

  const getValue = (levelId: string, feeTypeId: string): string => {
    const key = `${levelId}_${feeTypeId}`;
    if (edits[key] !== undefined) return edits[key];
    const s = structureMap.get(key);
    return s ? String(Number(s.amount)) : "";
  };

  const handleChange = (levelId: string, feeTypeId: string, value: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    setEdits((prev) => ({ ...prev, [`${levelId}_${feeTypeId}`]: cleaned }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    for (const [key, value] of Object.entries(edits)) {
      const [levelId, feeTypeId] = key.split("_");
      const amount = parseInt(value, 10);
      const existing = structureMap.get(key);

      if (!value || isNaN(amount)) {
        // Si la valeur est vide et qu'il y a un existant, on pourrait supprimer
        // Pour simplicite : on ignore
        continue;
      }

      if (existing) {
        if (Number(existing.amount) !== amount) {
          await updateMutation.mutateAsync({
            id: existing.id,
            input: { amount },
          });
        }
      } else {
        await createMutation.mutateAsync({
          academicYearId,
          levelId,
          feeTypeId,
          amount,
          installments: 1,
        });
      }
    }
    setEdits({});
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6" />
            Grille tarifaire
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Définissez les montants par niveau et par année scolaire
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={academicYearId}
            onChange={(e) => {
              setAcademicYearId(e.target.value);
              setEdits({});
              setHasChanges(false);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {academicYears?.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label} {y.isCurrent ? "(en cours)" : ""}
              </option>
            ))}
          </select>
          <Button
            onClick={handleSave}
            disabled={
              !hasChanges || createMutation.isPending || updateMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* INFO */}
      <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-3">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <div>
          <strong>Comment ça marche :</strong> chaque cellule correspond à un frais pour un niveau.
          Les montants sont en <strong>FCFA</strong>. Laissez vide si le frais ne s'applique pas.
          <br />
          <strong>Note :</strong> les modifications ne sont pas encore enregistrées. Cliquez sur
          <strong> Enregistrer</strong> pour valider.
        </div>
      </div>

      {/* GRILLE */}
      {!academicYearId ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Sélectionnez une année scolaire
          </CardContent>
        </Card>
      ) : activeTypes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Aucun type de frais actif. Créez-en d'abord dans "Types de frais".
          </CardContent>
        </Card>
      ) : sortedLevels.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Aucun niveau configuré
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-medium sticky left-0 bg-muted/40 z-10 min-w-[180px]">
                      Niveau
                    </th>
                    {activeTypes.map((ft: FeeType) => {
                      const info = FEE_CATEGORY_LABELS[ft.category];
                      return (
                        <th
                          key={ft.id}
                          className="text-center p-3 font-medium min-w-[130px]"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{info.emoji}</span>
                            <span className="text-xs">{ft.name}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedLevels.map((level) => (
                    <tr
                      key={level.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-3 font-medium sticky left-0 bg-background z-10">
                        <div>
                          <div>{level.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {level.cycle === "PREMIER_CYCLE" ? "📗 1er" : "📘 2ème"}
                          </div>
                        </div>
                      </td>
                      {activeTypes.map((ft: FeeType) => {
                        const value = getValue(level.id, ft.id);
                        return (
                          <td key={ft.id} className="p-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={value}
                              onChange={(e) =>
                                handleChange(level.id, ft.id, e.target.value)
                              }
                              placeholder="—"
                              className={cn(
                                "w-full h-9 px-2 text-center text-sm font-mono rounded-md border transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                                value
                                  ? "border-input bg-background"
                                  : "border-dashed border-input/50 bg-muted/20",
                              )}
                            />
                            {value && (
                              <div className="text-[10px] text-center text-muted-foreground mt-0.5">
                                {formatFCFA(parseInt(value, 10))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOOTER STICKY */}
      {hasChanges && (
        <div className="flex items-center justify-between gap-3 sticky bottom-4 bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
          <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            ● Modifications non enregistrées
          </span>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
