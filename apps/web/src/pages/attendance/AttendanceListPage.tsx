import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Plus, Loader2, Eye } from "lucide-react";
import { useAttendanceSessions } from "@/hooks/attendance";
import { formatDate } from "@/lib/formatters";
import { Button, Card, CardContent } from "@/components/ui";

export function AttendanceListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAttendanceSessions({ page, limit: 20 });

  const sessions = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Presences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total || 0} session(s) enregistree(s)
          </p>
        </div>
        <Button asChild>
          <Link to="/attendance/new">
            <Plus className="h-4 w-4" />
            Nouvelle session
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucune session de presence</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/attendance/new">
                  <Plus className="h-4 w-4" />
                  Creer la premiere session
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Matiere</th>
                    <th className="px-4 py-3">Enseignant</th>
                    <th className="px-4 py-3">Eleves</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session: any) => (
                    <tr key={session.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(session.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {session.class?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {session.subject?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {session.teacher
                          ? `${session.teacher.firstName} ${session.teacher.lastName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {session._count?.records || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/attendance/${session.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
