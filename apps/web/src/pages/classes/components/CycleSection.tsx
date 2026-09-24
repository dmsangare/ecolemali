import { Plus, School } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ClassCard } from "./ClassCard";
import type { ClassItem, LevelCycle } from "@/types/class";
import { CYCLE_LABELS } from "@/types/class";

interface CycleSectionProps {
  cycle: LevelCycle;
  classes: ClassItem[];
  onCreateClick: () => void;
}

export function CycleSection({
  cycle,
  classes,
  onCreateClick,
}: CycleSectionProps) {
  const isFirstCycle = cycle === "PREMIER_CYCLE";
  const count = classes.length;

  // Couleurs selon le cycle
  const colors = isFirstCycle
    ? {
        header: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-900",
        bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
        button:
          "bg-emerald-600 hover:bg-emerald-700 text-white",
        icon: "text-emerald-600",
      }
    : {
        header: "text-blue-700 dark:text-blue-400",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-900",
        bg: "bg-blue-50/50 dark:bg-blue-950/20",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        icon: "text-blue-600",
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
          <h2 className={cn("text-lg font-semibold flex items-center gap-2", colors.header)}>
            <School className={cn("h-5 w-5", colors.icon)} />
            {CYCLE_LABELS[cycle]}
          </h2>
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              colors.badge,
            )}
          >
            {count} classe{count > 1 ? "s" : ""}
          </span>
        </div>

        <Button
          size="sm"
          onClick={onCreateClick}
          className={cn(colors.button)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nouvelle classe
        </Button>
      </div>

      {/* CONTENU */}
      {count === 0 ? (
        <Card className={cn("border-dashed", colors.border, colors.bg)}>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <div
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center",
                colors.badge,
              )}
            >
              <School className="h-7 w-7" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">
                Aucune classe {isFirstCycle ? "du premier cycle" : "du deuxieme cycle"}
              </p>
              <p className="text-sm text-muted-foreground">
                Creez votre premiere classe{" "}
                {isFirstCycle
                  ? "(1ere A, 2eme A, ...)"
                  : "(7eme A, 8eme A, ...)"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={onCreateClick}
              className={cn(colors.button)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Creer une classe
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
