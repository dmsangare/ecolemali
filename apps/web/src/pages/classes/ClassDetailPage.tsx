import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, School, Settings, Copy } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClass } from "@/hooks/classes";
import { InfoTab } from "./components/InfoTab";
import { StudentsTab } from "./components/StudentsTab";
import { SubjectsTab } from "./components/SubjectsTab";
import { TeachersTab } from "./components/TeachersTab";
import { TimetableTab } from "./components/TimetableTab";
import { EditClassModal } from "./components/EditClassModal";
import { DuplicateClassModal } from "./components/DuplicateClassModal";

type TabKey = "info" | "students" | "subjects" | "teachers" | "timetable";

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const { data: cls, isLoading } = useClass(id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <School className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">Classe introuvable</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/classes">Retour a la liste</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFirstCycle = cls.level?.cycle === "PREMIER_CYCLE";

  const tabs: { key: TabKey; label: string; emoji: string }[] = [
    { key: "info", label: "Infos", emoji: "📋" },
    { key: "students", label: "Eleves", emoji: "👥" },
    { key: "subjects", label: "Matieres", emoji: "📚" },
    { key: "teachers", label: "Profs", emoji: "👨‍🏫" },
    { key: "timetable", label: "EDT", emoji: "📅" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <Link
          to="/classes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux classes
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "h-14 w-14 rounded-lg flex items-center justify-center text-2xl font-bold shrink-0",
                isFirstCycle
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
              )}
            >
              {cls.code}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                {cls.level && <span>{cls.level.name}</span>}
                {cls.room && <span>· Salle {cls.room.name}</span>}
                {cls._count && (
                  <span>· {cls._count.enrollments} eleve(s) / {cls.capacity}</span>
                )}
                {cls.academicYear && <span>· {cls.academicYear.label}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDuplicateOpen(true)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === t.key
                  ? isFirstCycle
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                    : "border-blue-500 text-blue-700 dark:text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="mr-1.5">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENU */}
      <div>
        {activeTab === "info" && <InfoTab classId={id!} />}
        {activeTab === "students" && <StudentsTab classId={id!} />}
        {activeTab === "subjects" && <SubjectsTab classId={id!} levelId={cls.levelId} />}
        {activeTab === "teachers" && <TeachersTab classId={id!} academicYearId={cls.academicYearId} />}
        {activeTab === "timetable" && <TimetableTab classId={id!} />}
      </div>

      {/* MODALE MODIFICATION */}
      {editOpen && cls && (
        <EditClassModal classItem={cls} onClose={() => setEditOpen(false)} />
      )}

      {duplicateOpen && cls && (
        <DuplicateClassModal
          sourceClass={cls}
          onClose={() => setDuplicateOpen(false)}
        />
      )}
    </div>
  );
}
