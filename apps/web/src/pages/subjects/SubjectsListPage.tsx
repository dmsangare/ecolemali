import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Search, Loader2, Trash2 } from "lucide-react";
import { useSubjects, useDeleteSubject } from "@/hooks/subjects";
import {
  Button,
  Input,
  Card,
  CardContent,
} from "@/components/ui";

const TYPE_LABELS: Record<string, string> = {
  CORE: "Obligatoire",
  OPTIONAL: "Optionnelle",
  SPORT: "Sport",
  ART: "Art",
};

export function SubjectsListPage() {
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const filters = useMemo(() => ({ q: q || undefined }), [q]);
  const { data: subjects, isLoading } = useSubjects(filters);
  const deleteMutation = useDeleteSubject();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Supprimer la matiere ${name} ?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Matieres
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subjects?.length || 0} matiere(s)
          </p>
        </div>
        <Button asChild>
          <Link to="/subjects/new">
            <Plus className="h-4 w-4" />
            Nouvelle matiere
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Rechercher
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !subjects || subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col h-64 items-center justify-center gap-3">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucune matiere</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold">{subject.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {subject.code}
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {TYPE_LABELS[subject.type] || subject.type}
                  </span>
                </div>

                {subject.coefficients && subject.coefficients.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Coefficients :
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {subject.coefficients.slice(0, 5).map((c) => (
                        <span
                          key={c.id}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {c.level.code}: {c.coefficient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(subject.id, subject.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
