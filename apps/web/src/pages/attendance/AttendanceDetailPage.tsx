import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Save, Users, TrendingUp } from "lucide-react";
import { useAttendanceSession, useUpdateAttendanceRecords } from "@/hooks/attendance";
import { formatDate, initials } from "@/lib/formatters";
import { Button, Card, CardContent, Avatar, AvatarFallback } from "@/components/ui";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  LATE: "Retard",
  ABSENT_JUSTIFIED: "Absence justifiée",
  ABSENT_UNJUSTIFIED: "Absence non justifiée",
};

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700 border-green-200",
  ABSENT: "bg-red-100 text-red-700 border-red-200",
  LATE: "bg-amber-100 text-amber-700 border-amber-200",
  ABSENT_JUSTIFIED: "bg-blue-100 text-blue-700 border-blue-200",
  ABSENT_UNJUSTIFIED: "bg-red-100 text-red-700 border-red-200",
};

export function AttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useAttendanceSession(id);
  const updateMut = useUpdateAttendanceRecords();

  const [localRecords, setLocalRecords] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <div className="p-6">Session introuvable</div>;
  }

  const s: any = session;
  const records: any[] = (s.records ?? []).map((r: any) => ({
    ...r,
    status: localRecords[r.studentId] ?? r.status,
  }));

  const present = records.filter((r: any) => r.status === "PRESENT").length;
  const absent = records.filter((r: any) => r.status?.startsWith("ABSENT")).length;
  const late = records.filter((r: any) => r.status === "LATE").length;
  const rate = records.length > 0 ? (present / records.length) * 100 : 0;

  const setStatus = (studentId: string, status: string) => {
    setLocalRecords((prev) => ({ ...prev, [studentId]: status }));
    setDirty(true);
  };

  const markAll = (status: string) => {
    const next: Record<string, string> = {};
    for (const r of records) next[r.studentId] = status;
    setLocalRecords(next);
    setDirty(true);
  };

  const save = () => {
    const payload = records.map((r) => ({
      studentId: r.studentId,
      status: r.status,
    }));
    updateMut.mutate(
      { sessionId: id!, records: payload },
      { onSuccess: () => { setDirty(false); setLocalRecords({}); } }
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/attendance">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {s.class?.name} — {formatDate(s.date)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {s.subject?.name ?? "—"} · {s.teacher?.firstName} {s.teacher?.lastName}
            </p>
          </div>
        </div>
        {dirty && (
          <Button onClick={save} disabled={updateMut.isPending}>
            <Save className="h-4 w-4 mr-2" /> Enregistrer
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Présents</p>
              <p className="text-xl font-bold text-green-600">{present}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Absents</p>
              <p className="text-xl font-bold text-red-600">{absent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Retards</p>
              <p className="text-xl font-bold text-amber-600">{late}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taux présence</p>
              <p className="text-xl font-bold text-blue-600">{rate.toFixed(1)} %</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground mr-2 self-center">Actions rapides :</span>
            <Button variant="outline" size="sm" onClick={() => markAll("PRESENT")}>
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> Tous présents
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll("ABSENT")}>
              <XCircle className="h-4 w-4 mr-1 text-red-600" /> Tous absents
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {records.length} élève(s)
          </div>
        </CardContent>
      </Card>

      {/* Liste des élèves */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                <th className="px-4 py-3">Élève</th>
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => {
                const st = r.student;
                return (
                  <tr key={r.studentId} className="border-b hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {st ? `${st.firstName?.[0] ?? ""}${st.lastName?.[0] ?? ""}` : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {st ? `${st.lastName} ${st.firstName}` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {st?.matricule ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant={r.status === "PRESENT" ? "default" : "outline"}
                          size="sm"
                          className={r.status === "PRESENT" ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => setStatus(r.studentId, "PRESENT")}
                        >
                          P
                        </Button>
                        <Button
                          variant={r.status === "LATE" ? "default" : "outline"}
                          size="sm"
                          className={r.status === "LATE" ? "bg-amber-600 hover:bg-amber-700" : ""}
                          onClick={() => setStatus(r.studentId, "LATE")}
                        >
                          R
                        </Button>
                        <Button
                          variant={r.status?.startsWith("ABSENT") ? "default" : "outline"}
                          size="sm"
                          className={r.status?.startsWith("ABSENT") ? "bg-red-600 hover:bg-red-700" : ""}
                          onClick={() => setStatus(r.studentId, "ABSENT_UNJUSTIFIED")}
                        >
                          A
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
