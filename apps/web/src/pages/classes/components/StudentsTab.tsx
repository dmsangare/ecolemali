import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Users, ExternalLink, Loader2, UserPlus, Trash2 } from "lucide-react";
import { Input, Card, CardContent, Button } from "@/components/ui";
import { useClassDashboard, useClass } from "@/hooks/classes";
import { AssignStudentsModal } from "./AssignStudentsModal";
import { RemoveStudentModal } from "./RemoveStudentModal";
import { useAuth } from "@/contexts/AuthContext";
import { ExportMenuButton } from "./ExportMenuButton";

export function StudentsTab({ classId }: { classId: string }) {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("class:update");
  const [search, setSearch] = useState("");
  const { data: dashboard, isLoading } = useClassDashboard(classId);
  const { data: cls } = useClass(classId);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const students = dashboard?.students || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s: any) =>
      `${s.firstName} ${s.lastName} ${s.matricule}`
        .toLowerCase()
        .includes(q),
    );
  }, [students, search]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">
            0 eleve(s) dans cette classe
          </span>
          <div className="flex items-center gap-2">
            <ExportMenuButton classId={classId} />
            {canUpdate && (
              <Button onClick={() => setAssignOpen(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Affecter des eleves
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Aucun eleve inscrit dans cette classe</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Commencez par affecter des eleves a cette classe
            </p>
            {canUpdate && (
              <Button onClick={() => setAssignOpen(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Affecter des eleves
              </Button>
            )}
          </CardContent>
        </Card>

        {assignOpen && cls && (
          <AssignStudentsModal
            classId={classId}
            levelId={cls.levelId}
            academicYearId={cls.academicYearId}
            enrolledStudentIds={[]}
            onClose={() => setAssignOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un eleve..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filtered.length} / {students.length} eleve(s)
          </span>
          <ExportMenuButton classId={classId} />
          {canUpdate && (
            <Button onClick={() => setAssignOpen(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Affecter des eleves
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Matricule</th>
                  <th className="text-left p-3 font-medium">Nom & Prenom</th>
                  <th className="text-left p-3 font-medium">Sexe</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.matricule}</td>
                    <td className="p-3 font-medium">
                      {s.lastName} {s.firstName}
                    </td>
                    <td className="p-3">
                      {s.gender === "M" ? "👦 M" : "👧 F"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/students/${s.id}`}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Voir fiche
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setRemoveTarget({
                              id: s.id,
                              name: `${s.lastName} ${s.firstName}`,
                            })
                          }
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {assignOpen && cls && (
        <AssignStudentsModal
          classId={classId}
          levelId={cls.levelId}
          academicYearId={cls.academicYearId}
          enrolledStudentIds={students.map((s: any) => s.id)}
          onClose={() => setAssignOpen(false)}
        />
      )}

      {removeTarget && (
        <RemoveStudentModal
          classId={classId}
          studentId={removeTarget.id}
          studentName={removeTarget.name}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
