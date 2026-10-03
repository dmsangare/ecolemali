import { useState, useMemo } from "react";
import { School, Search, Loader2, Plus } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useClasses } from "@/hooks/classes";
import { CycleSection } from "./components/CycleSection";
import { CreateClassModal } from "./components/CreateClassModal";
import type { ClassItem, LevelCycle } from "@/types/class";

export function ClassesListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultCycle, setModalDefaultCycle] =
    useState<LevelCycle>("PREMIER_CYCLE");

  const { data: classes, isLoading } = useClasses();

  // --- Filtrage par recherche ---
  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.level?.name?.toLowerCase().includes(q) ||
        c.room?.name?.toLowerCase().includes(q),
    );
  }, [classes, searchQuery]);

  // --- Repartition par cycle ---
  const { firstCycle, secondCycle } = useMemo(() => {
    const first: ClassItem[] = [];
    const second: ClassItem[] = [];
    filteredClasses.forEach((c) => {
      if (c.level?.cycle === "PREMIER_CYCLE") first.push(c);
      else if (c.level?.cycle === "DEUXIEME_CYCLE") second.push(c);
    });
    return { firstCycle: first, secondCycle: second };
  }, [filteredClasses]);

  // --- Ouverture modale ---
  const openModal = (cycle: LevelCycle) => {
    setModalDefaultCycle(cycle);
    setModalOpen(true);
  };

  // --- Stats globales ---
  const totalClasses = classes?.length ?? 0;
  const totalStudents = useMemo(() => {
    if (!classes) return 0;
    return classes.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0);
  }, [classes]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <School className="h-6 w-6" />
            Classes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalClasses} classe{totalClasses > 1 ? "s" : ""} ·{" "}
            {totalStudents} eleve{totalStudents > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => openModal("PREMIER_CYCLE")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle classe
        </Button>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une classe (nom, code, niveau, salle)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* CONTENU */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : totalClasses === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <School className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Aucune classe pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Commencez par creer votre premiere classe
            </p>
          </div>
          <Button onClick={() => openModal("PREMIER_CYCLE")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle classe
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <CycleSection
            cycle="PREMIER_CYCLE"
            classes={firstCycle}
            onCreateClick={() => openModal("PREMIER_CYCLE")}
          />
          <CycleSection
            cycle="DEUXIEME_CYCLE"
            classes={secondCycle}
            onCreateClick={() => openModal("DEUXIEME_CYCLE")}
          />
        </div>
      )}

      {/* MODALE DE CREATION */}
      {modalOpen && (
        <CreateClassModal
          defaultCycle={modalDefaultCycle}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
