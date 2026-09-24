import { Link } from "react-router-dom";
import { Users, MapPin, UserCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ClassItem, LevelCycle } from "@/types/class";

interface ClassCardProps {
  classItem: ClassItem;
  cycle: LevelCycle;
}

export function ClassCard({ classItem, cycle }: ClassCardProps) {
  const isFirstCycle = cycle === "PREMIER_CYCLE";

  // Couleurs selon le cycle
  const colors = isFirstCycle
    ? {
        border: "border-l-4 border-l-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        hover: "hover:border-emerald-300 hover:shadow-emerald-100/50",
      }
    : {
        border: "border-l-4 border-l-blue-500",
        badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        hover: "hover:border-blue-300 hover:shadow-blue-100/50",
      };

  // Compteurs
  const enrollmentCount = classItem._count?.enrollments ?? 0;
  const capacity = classItem.capacity ?? 50;
  const fillRate = capacity > 0 ? (enrollmentCount / capacity) * 100 : 0;

  // Jauge de remplissage (couleur selon %)
  const gaugeColor =
    fillRate >= 90
      ? "bg-red-500"
      : fillRate >= 70
        ? "bg-orange-500"
        : isFirstCycle
          ? "bg-emerald-500"
          : "bg-blue-500";

  // Nom complet du titulaire
  const teacherName = classItem.mainTeacher
    ? `${classItem.mainTeacher.firstName} ${classItem.mainTeacher.lastName}`
    : null;

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-md",
        colors.border,
        colors.hover,
      )}
    >
      <CardContent className="p-5 space-y-4">
        {/* HEADER — Nom + Code */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg leading-tight truncate">
              {classItem.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "text-xs font-mono px-2 py-0.5 rounded",
                  colors.badge,
                )}
              >
                {classItem.code}
              </span>
              {classItem.level && (
                <span className="text-xs text-muted-foreground truncate">
                  {classItem.level.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* INFOS — Salle + Effectif + Titulaire */}
        <div className="space-y-2 text-sm">
          {/* Salle */}
          {classItem.room && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{classItem.room.name}</span>
            </div>
          )}

          {/* Effectif + jauge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <span className="font-medium text-foreground">
                    {enrollmentCount}
                  </span>
                  {" / "}
                  {capacity} eleves
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(fillRate)}%
              </span>
            </div>
            {/* Jauge */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", gaugeColor)}
                style={{ width: `${Math.min(fillRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Titulaire */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
            {teacherName ? (
              <span className="truncate">{teacherName}</span>
            ) : (
              <span className="italic text-muted-foreground/70">
                Aucun titulaire
              </span>
            )}
          </div>
        </div>

        {/* ACTION — Voir details */}
        <Link
          to={`/classes/${classItem.id}`}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md",
            "text-sm font-medium transition-colors",
            "bg-muted hover:bg-muted/80 group-hover:bg-primary group-hover:text-primary-foreground",
          )}
        >
          Voir details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
