import { UserCog, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

interface Assignment {
  id: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: string | null;
  };
  subject?: { id: string; name: string; code: string };
  isMain?: boolean;
}

export function TeachersTab({
  classId,
  academicYearId: _academicYearId,
}: {
  classId: string;
  academicYearId: string;
}) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["teacher-assignments", "class", classId],
    queryFn: async () => {
      const { data } = await api.get("/teacher-assignments", {
        params: { classId },
      });
      return (data.data || data) as Assignment[];
    },
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <UserCog className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium">Aucun enseignant affecte</p>
          <p className="text-sm text-muted-foreground mt-1">
            Affectez des enseignants aux matieres de cette classe
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left p-3 font-medium">Enseignant</th>
                <th className="text-left p-3 font-medium">Specialite</th>
                <th className="text-left p-3 font-medium">Matiere</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">
                    {a.teacher
                      ? `${a.teacher.lastName} ${a.teacher.firstName}`
                      : "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {a.teacher?.specialty || "—"}
                  </td>
                  <td className="p-3">{a.subject?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
