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

  // Couleurs selon le cycle — tokens SIS
  const colors = isFirstCycle
    ? {
        border: "border-l-4 border-l-sis-brand",
        badge:
          "bg-sis-brand-50 text-sis-brand dark:bg-sis-brand-900/30 dark:text-sis-brand-300",
        hover: "hover:border-sis-brand/50 hover:shadow-sis-md",
      }
    : {
        border: "border-l-4 border-l-sis-info",
        badge:
          "bg-sis-info-bg text-sis-info dark:bg-sis-info-bg/30 dark:text-sis-info",
        hover: "hover:border-sis-info/50 hover:shadow-sis-md",
      };

  // Compteurs
  const enrollmentCount = classItem._count?.enrollments ?? 0;
  const capacity = classItem.capacity ?? 50;
  const fillRate = capacity > 0 ? (enrollmentCount / capacity) * 100 : 0;

  // Jauge de remplissage — couleurs sémantiques SIS
  const gaugeColor =
    fillRate >= 90
      ? "bg-sis-danger"
      : fillRate >= 70
        ? "bg-sis-warning"
        : "bg-sis-success";

  // Nom complet du titulaire
  const teacherName = classItem.mainTeacher
    ? `${classItem.mainTeacher.firstName} ${classItem.mainTeacher.lastName}`
    : null;

  return (
    <Card
      className={cn(
        "group rounded-sis-lg border-sis-neutral-200 shadow-sis-sm transition-all dark:border-sis-neutral-800",
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
                  {capacity} élèves
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(fillRate)}%
              </span>
            </div>
            {/* Jauge */}
            <div className="h-1.5 bg-sis-neutral-100 rounded-full overflow-hidden dark:bg-sis-neutral-800">
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
            "flex items-center justify-center gap-2 w-full py-2 px-3 rounded-sis-md",
            "text-sm font-medium transition-colors",
            "bg-sis-neutral-100 hover:bg-sis-neutral-200 text-foreground",
            "group-hover:bg-sis-brand group-hover:text-sis-brand-foreground",
            "dark:bg-sis-neutral-800 dark:hover:bg-sis-neutral-700",
          )}
        >
          Voir détails
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  );
}