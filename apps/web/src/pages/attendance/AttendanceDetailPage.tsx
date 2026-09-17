import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAttendanceSession } from "@/hooks/attendance";
import { formatDate, initials } from "@/lib/formatters";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
} from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Retard",
  ABSENT_JUSTIFIED: "Absence justifiee",
  ABSENT_UNJUSTIFIED: "Absence non justifiee",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PRESENT: CheckCircle2,
  ABSENT: XCircle,
  LATE: Clock,
  ABSENT_JUSTIFIED: CheckCircle2,
  ABSENT_UNJUSTIFIED: XCircle,
};

export function AttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading, error } = useAttendanceSession(id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Session introuvable</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/attendance")}>
              Retour a la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const records = session.records || [];
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter(
    (r) => r.status === "ABSENT" || r.status === "ABSENT_UNJUSTIFIED"
  ).length;
  const late = records.filter((r) => r.status === "LATE").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Session de presence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.class?.name || "—"} — {formatDate(session.date)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Presents</p>
            <p className="text-2xl font-bold text-green-600">{present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Absents</p>
            <p className="text-2xl font-bold text-red-600">{absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Retards</p>
            <p className="text-2xl font-bold text-orange-600">{late}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des eleves</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                  <th className="px-4 py-3">Eleve</th>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const Icon = STATUS_ICONS[record.status] || CheckCircle2;
                  return (
                    <tr key={record.id} className="border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {record.student
                                ? initials(record.student.firstName, record.student.lastName)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {record.student?.lastName} {record.student?.firstName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {record.student?.matricule}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Icon className="h-4 w-4" />
                          {STATUS_LABELS[record.status] || record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
