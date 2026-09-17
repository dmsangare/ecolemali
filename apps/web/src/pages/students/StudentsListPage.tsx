import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useStudents, useDeleteStudent } from "@/hooks/students";
import { formatDate, initials } from "@/lib/formatters";
import {
  Button,
  Input,
  Card,
  CardContent,
  Avatar,
  AvatarFallback,
} from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  TRANSFERRED: "Transfere",
  GRADUATED: "Diplome",
  DROPPED: "Abandon",
  SUSPENDED: "Suspendu",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-700",
  TRANSFERRED: "bg-blue-500/10 text-blue-700",
  GRADUATED: "bg-purple-500/10 text-purple-700",
  DROPPED: "bg-red-500/10 text-red-700",
  SUSPENDED: "bg-orange-500/10 text-orange-700",
};

export function StudentsListPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("");

  const filters = useMemo(
    () => ({ page, limit: 20, q: q || undefined, status: status || undefined }),
    [page, q, status]
  );

  const { data, isLoading } = useStudents(filters);
  const deleteMutation = useDeleteStudent();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Supprimer l eleve ${name} ? Cette action est reversible.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tete */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Eleves
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.meta.total || 0} eleve(s) enregistre(s)
          </p>
        </div>
        <Button asChild>
          <Link to="/students/new">
            <UserPlus className="h-4 w-4" />
            Nouvel eleve
          </Link>
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prenom ou matricule..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="TRANSFERRED">Transfere</option>
              <option value="GRADUATED">Diplome</option>
              <option value="DROPPED">Abandon</option>
              <option value="SUSPENDED">Suspendu</option>
            </select>
            <Button type="submit" variant="secondary">
              Rechercher
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun eleve trouve</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/students/new">
                  <Plus className="h-4 w-4" />
                  Ajouter le premier eleve
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                      <th className="px-4 py-3">Eleve</th>
                      <th className="px-4 py-3">Matricule</th>
                      <th className="px-4 py-3">Sexe</th>
                      <th className="px-4 py-3">Date de naissance</th>
                      <th className="px-4 py-3">Classe</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initials(student.firstName, student.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                to={`/students/${student.id}`}
                                className="text-sm font-medium hover:underline"
                              >
                                {student.lastName} {student.firstName}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                          {student.matricule}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {student.gender === "M" ? "Masculin" : "Feminin"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDate(student.birthDate)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {student.enrollments?.[0]?.class?.name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              STATUS_COLORS[student.status] || "bg-gray-500/10"
                            }`}
                          >
                            {STATUS_LABELS[student.status] || student.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/students/${student.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/students/${student.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDelete(
                                  student.id,
                                  `${student.firstName} ${student.lastName}`
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.meta.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {data.meta.page} sur {data.meta.pages} — {data.meta.total} eleve(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Precedent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === data.meta.pages}
                      onClick={() => setPage(page + 1)}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
