import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Search, Loader2, Mail, Phone } from "lucide-react";
import { useTeachers } from "@/hooks/teachers";
import { initials, formatDate } from "@/lib/formatters";
import {
  Button,
  Input,
  Card,
  CardContent,
  Avatar,
  AvatarFallback,
} from "@/components/ui";

export function TeachersListPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const filters = useMemo(
    () => ({ page, limit: 20, q: q || undefined }),
    [page, q]
  );

  const { data, isLoading } = useTeachers(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Enseignants
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.meta.total || 0} enseignant(s)
          </p>
        </div>
        <Button asChild>
          <Link to="/teachers/new">
            <Plus className="h-4 w-4" />
            Nouvel enseignant
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, matricule, specialite..."
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

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun enseignant trouve</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Enseignant</th>
                    <th className="px-4 py-3">Matricule</th>
                    <th className="px-4 py-3">Specialite</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Classes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((teacher) => (
                    <tr key={teacher.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials(teacher.firstName, teacher.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              to={`/teachers/${teacher.id}`}
                              className="text-sm font-medium hover:underline"
                            >
                              {teacher.lastName} {teacher.firstName}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {teacher.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {teacher.matricule}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {teacher.specialty || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {teacher.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {teacher.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {teacher._count?.mainTeacherClasses || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
