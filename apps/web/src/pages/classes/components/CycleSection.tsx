import { Plus, School } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ClassCard } from "./ClassCard";
import type { ClassItem, LevelCycle } from "@/types/class";
import { CYCLE_LABELS } from "@/types/class";

interface CycleSectionProps {
  cycle: LevelCycle;
  classes: ClassItem[];
  onCreateClick: () => void;
  canCreate?: boolean;
}

export function CycleSection({
  cycle,
  classes,
  onCreateClick,
  canCreate = true,
}: CycleSectionProps) {
  const isFirstCycle = cycle === "PREMIER_CYCLE";
  const count = classes.length;

  // Couleurs SIS selon le cycle
  const colors = isFirstCycle
    ? {
        header: "text-sis-brand",
        badge:
          "bg-sis-brand-50 text-sis-brand dark:bg-sis-brand-900/30 dark:text-sis-brand-300",
        border: "border-sis-brand/30 dark:border-sis-brand-800",
        bg: "bg-sis-brand-50/40 dark:bg-sis-brand-900/10",
        button: "",
        icon: "text-sis-brand",
      }
    : {
        header: "text-sis-info",
        badge:
          "bg-sis-info-bg text-sis-info dark:bg-sis-info-bg/30 dark:text-sis-info",
        border: "border-sis-info/30 dark:border-sis-info/40",
        bg: "bg-sis-info-bg/40 dark:bg-sis-info-bg/10",
        button: "",
        icon: "text-sis-info",
      };

  // Ordre : par niveau (orderIndex) puis par code
  const sortedClasses = [...classes].sort((a, b) => {
    const orderA = a.level?.orderIndex ?? 999;
    const orderB = b.level?.orderIndex ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.code.localeCompare(b.code);
  });

  return (
    <section className="space-y-4">
      {/* HEADER DE SECTION */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2
            className={cn(
              "text-lg font-semibold flex items-center gap-2",
              colors.header
            )}
          >
            <School className={cn("h-5 w-5", colors.icon)} />
            {CYCLE_LABELS[cycle]}
          </h2>
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              colors.badge
            )}
          >
            {count} classe{count > 1 ? "s" : ""}
          </span>
        </div>

        {canCreate && (
          <Button
            size="sm"
            onClick={onCreateClick}
            className={colors.button}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle classe
          </Button>
        )}
      </div>

      {/* CONTENU */}
      {count === 0 ? (
        <Card
          className={cn(
            "border-dashed rounded-sis-lg",
            colors.border,
            colors.bg
          )}
        >
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <div
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center",
                colors.badge
              )}
            >
              <School className="h-7 w-7" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">
                Aucune classe{" "}
                {isFirstCycle ? "du premier cycle" : "du deuxième cycle"}
              </p>
              <p className="text-sm text-muted-foreground">
                Créez votre première classe{" "}
                {isFirstCycle
                  ? "(1ère A, 2ème A, ...)"
                  : "(7ème A, 8ème A, ...)"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={onCreateClick}
              className={colors.button}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Créer une classe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedClasses.map((cls) => (
            <ClassCard key={cls.id} classItem={cls} cycle={cycle} />
          ))}
        </div>
      )}
    </section>
  );
}