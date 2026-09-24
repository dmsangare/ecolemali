import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, School, Hash, Calendar } from "lucide-react";
import { Input, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { api } from "@/lib/axios";

export interface SchoolData {
  cycle: "PREMIER_CYCLE" | "DEUXIEME_CYCLE" | "LYCEE" | "";
  levelId: string;
  classId: string;
  academicYearId: string;
  previousSchool: string;
}

interface Step2SchoolProps {
  data: SchoolData;
  onChange: (data: Partial<SchoolData>) => void;
  errors: Record<string, string>;
}

export function Step2School({ data, onChange, errors }: Step2SchoolProps) {
  // Charger niveaux
  const { data: levelsData } = useQuery({
    queryKey: ["levels", "for-wizard"],
    queryFn: async () => {
      const { data } = await api.get("/levels");
      return data.data || data;
    },
  });

  // Charger classes
  const { data: classesData } = useQuery({
    queryKey: ["classes", "for-wizard"],
    queryFn: async () => {
      const { data } = await api.get("/classes");
      return data.data || data;
    },
  });

  // Charger années scolaires
  const { data: yearsData } = useQuery({
    queryKey: ["academic-years", "for-wizard"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return data.data || data;
    },
  });

  const levels = levelsData || [];
  const classes = classesData || [];
  const academicYears = yearsData || [];

  // Filtrer les niveaux par cycle sélectionné
  const availableLevels = useMemo(() => {
    if (!data.cycle) return levels;
    return levels.filter((l: any) => l.cycle === data.cycle);
  }, [levels, data.cycle]);

  // Filtrer les classes par niveau sélectionné
  const availableClasses = useMemo(() => {
    if (!data.levelId) return [];
    return classes.filter((c: any) => c.levelId === data.levelId);
  }, [classes, data.levelId]);

  // Auto-sélectionner l'année courante
  useEffect(() => {
    if (!data.academicYearId && academicYears.length > 0) {
      const current = academicYears.find((y: any) => y.isCurrent);
      if (current) onChange({ academicYearId: current.id });
    }
  }, [academicYears, data.academicYearId, onChange]);

  // Reset le niveau si le cycle change
  useEffect(() => {
    if (data.cycle && data.levelId) {
      const level = levels.find((l: any) => l.id === data.levelId);
      if (level && level.cycle !== data.cycle) {
        onChange({ levelId: "", classId: "" });
      }
    }
  }, [data.cycle, data.levelId, levels, onChange]);

  const cycleOptions = [
    { value: "PREMIER_CYCLE", label: "Premier cycle", range: "1ere - 6eme", icon: "📚" },
    { value: "DEUXIEME_CYCLE", label: "Deuxieme cycle", range: "7eme - 9eme (DEF)", icon: "📖" },
    { value: "LYCEE", label: "Lycee", range: "10eme - 12eme (BAC)", icon: "🎓" },
  ];

  return (
    <div className="space-y-6">
      {/* Cycle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" />
            Cycle d enseignement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {cycleOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col gap-1 rounded-lg border p-4 cursor-pointer transition-colors ${
                  data.cycle === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="cycle"
                  checked={data.cycle === opt.value}
                  onChange={() => onChange({ cycle: opt.value as any, levelId: "", classId: "" })}
                  className="sr-only"
                />
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.range}</span>
              </label>
            ))}
          </div>
          {errors.cycle && (
            <p className="text-xs text-destructive mt-2">{errors.cycle}</p>
          )}
        </CardContent>
      </Card>

      {/* Niveau + Classe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <School className="h-4 w-4 text-primary" />
            Niveau et classe
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="levelId">
              Niveau <span className="text-destructive">*</span>
            </Label>
            <select
              id="levelId"
              value={data.levelId}
              onChange={(e) => onChange({ levelId: e.target.value, classId: "" })}
              disabled={!data.cycle}
              className={`flex h-9 w-full rounded-md border bg-transparent px-3 text-sm ${
                errors.levelId ? "border-destructive" : "border-input"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {data.cycle ? "Choisir un niveau" : "Choisir d abord un cycle"}
              </option>
              {availableLevels.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {errors.levelId && (
              <p className="text-xs text-destructive">{errors.levelId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classId">
              Classe <span className="text-destructive">*</span>
            </Label>
            <select
              id="classId"
              value={data.classId}
              onChange={(e) => onChange({ classId: e.target.value })}
              disabled={!data.levelId}
              className={`flex h-9 w-full rounded-md border bg-transparent px-3 text-sm ${
                errors.classId ? "border-destructive" : "border-input"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {data.levelId ? "Choisir une classe" : "Choisir d abord un niveau"}
              </option>
              {availableClasses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.room ? `— ${c.room.name}` : ""}
                </option>
              ))}
            </select>
            {data.levelId && availableClasses.length === 0 && (
              <p className="text-xs text-orange-600">
                Aucune classe disponible pour ce niveau
              </p>
            )}
            {errors.classId && (
              <p className="text-xs text-destructive">{errors.classId}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Année + école précédente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Inscription
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="academicYearId">
              Annee scolaire <span className="text-destructive">*</span>
            </Label>
            <select
              id="academicYearId"
              value={data.academicYearId}
              onChange={(e) => onChange({ academicYearId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Choisir une annee</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.label} {y.isCurrent ? "(En cours)" : ""}
                </option>
              ))}
            </select>
            {errors.academicYearId && (
              <p className="text-xs text-destructive">{errors.academicYearId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="previousSchool">Ecole precedente (optionnel)</Label>
            <Input
              id="previousSchool"
              value={data.previousSchool}
              onChange={(e) => onChange({ previousSchool: e.target.value })}
              placeholder="Ex: Ecole fondamentale de Badalabougou"
            />
          </div>

          <div className="md:col-span-2 rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-3">
            <Hash className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Matricule qui sera genere
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Format automatique : <strong>SIS-2026-NNNNNN</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
