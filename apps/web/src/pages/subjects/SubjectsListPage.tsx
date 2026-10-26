import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Search, Trash2, Hash } from "lucide-react";
import { useSubjects, useDeleteSubject } from "@/hooks/subjects";
import { useAuth } from "@/contexts/AuthContext";
import {
  Button,
  Input,
  Card,
  CardContent,
  PageLoader,
  EmptyState,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  CORE: "Obligatoire",
  OPTIONAL: "Optionnelle",
  SPORT: "Sport",
  ART: "Art",
};

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

function getTypeVariant(type: string): BadgeVariant {
  switch (type) {
    case "CORE":
      return "brand" as any; // fallback
    case "OPTIONAL":
      return "info";
    case "SPORT":
      return "success";
    case "ART":
      return "warning";
    default:
      return "neutral";
  }
}

export function SubjectsListPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("subject:create");
  const canDelete = hasPermission("subject:delete");
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
    if (confirm(`Supprimer la matière ${name} ?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sis-md bg-sis-brand-50 text-sis-brand mt-0.5 dark:bg-sis-brand-900/30 dark:text-sis-brand-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Matières</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {subjects?.length || 0} matière(s)
            </p>
          </div>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/subjects/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle matière
            </Link>
          </Button>
        )}
      </div>

      {/* SEARCH */}
      <div className="rounded-sis-lg border border-sis-neutral-200 bg-card p-4 dark:border-sis-neutral-800">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 rounded-sis-md border-sis-neutral-200 focus:ring-sis-brand/30 focus:border-sis-brand dark:border-sis-neutral-700"
            />
          </div>
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
        </form>
      </div>

      {/* CONTENU */}
      {isLoading ? (
        <PageLoader label="Chargement des matières..." />
      ) : !subjects || subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="Aucune matière"
          description="Commencez par ajouter votre première matière."
          action={
            canCreate ? (
              <Button asChild>
                <Link to="/subjects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle matière
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const typeVariant = getTypeVariant(subject.type);
            const typeClass =
              typeVariant === "info"
                ? "bg-sis-info-bg text-sis-info border-sis-info-border"
                : typeVariant === "success"
                  ? "bg-sis-success-bg text-sis-success border-sis-success-border"
                  : typeVariant === "warning"
                    ? "bg-sis-warning-bg text-sis-warning border-sis-warning-border"
                    : "bg-sis-brand-50 text-sis-brand border-sis-brand/30";

            return (
              <Card
                key={subject.id}
                className="rounded-sis-lg border-sis-neutral-200 shadow-sis-sm transition-all hover:shadow-sis-md dark:border-sis-neutral-800"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {subject.code}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border font-medium",
                        typeClass,
                      )}
                    >
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
                            className="text-xs bg-sis-neutral-100 text-sis-neutral-700 px-2 py-0.5 rounded dark:bg-sis-neutral-800 dark:text-sis-neutral-300"
                          >
                            {c.level.code}: {c.coefficient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {canDelete && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subject.id, subject.name)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}