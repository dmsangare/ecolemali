import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Plus, Loader2, Eye, TrendingUp, Users, AlertCircle, Filter, X } from "lucide-react";
import { useAttendanceSessions, useTodayAbsences } from "@/hooks/attendance";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { formatDate } from "@/lib/formatters";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { CreateAttendanceModal } from "./components/CreateAttendanceModal";

export function AttendanceListPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ classId: "", subjectId: "", date: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useAttendanceSessions({ page, limit: 20, ...filters });
  const { data: todayAbsences } = useTodayAbsences();

  const { data: classes } = useQuery({
    queryKey: ["classes", "list"],
    queryFn: async () => (await api.get("/classes")).data?.data ?? [],
  });

  const sessions = data?.data || [];
  const meta = data?.meta;

  // Stats calculées sur la page courante
  const stats = sessions.reduce(
    (acc: { total: number; present: number; absent: number; late: number }, s: any) => {
      const records = s.records ?? [];
      acc.total += records.length;
      acc.present += records.filter((r: any) => r.status === "PRESENT").length;
      acc.absent += records.filter((r: any) => r.status?.startsWith("ABSENT")).length;
      acc.late += records.filter((r: any) => r.status === "LATE").length;
      return acc;
    },
    { total: 0, present: 0, absent: 0, late: 0 }
  );
  const presenceRate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

  const resetFilters = () => setFilters({ classId: "", subjectId: "", date: "" });

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Présences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total || 0} session(s) enregistrée(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle session
          </Button>
        </div>
      </div>

      {/* Bandeau stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-xl font-bold">{meta?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taux présence</p>
              <p className="text-xl font-bold text-green-600">{presenceRate.toFixed(1)} %</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Présents (page)</p>
              <p className="text-xl font-bold">{stats.present}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Absents du jour</p>
              <p className="text-xl font-bold text-red-600">{todayAbsences?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">Classe</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={filters.classId}
                onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
              >
                <option value="">Toutes</option>
                {classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <label className="text-xs text-muted-foreground">Date</label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <Button variant="ghost" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" /> Réinitialiser
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucune session de présence</p>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Créer la première session
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Matière</th>
                    <th className="px-4 py-3">Enseignant</th>
                    <th className="px-4 py-3 text-center">Présents</th>
                    <th className="px-4 py-3 text-center">Absents</th>
                    <th className="px-4 py-3 text-center">Taux</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any) => {
                    const records = s.records ?? [];
                    const present = records.filter((r: any) => r.status === "PRESENT").length;
                    const absent = records.filter((r: any) => r.status?.startsWith("ABSENT")).length;
                    const rate = records.length > 0 ? (present / records.length) * 100 : 0;
                    return (
                      <tr key={s.id} className="border-b hover:bg-muted/30 transition">
                        <td className="px-4 py-3 font-medium">{formatDate(s.date)}</td>
                        <td className="px-4 py-3">{s.class?.name ?? "—"}</td>
                        <td className="px-4 py-3">{s.subject?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-sm">
                          {s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-green-600 font-semibold">{present}</td>
                        <td className="px-4 py-3 text-center text-red-600 font-semibold">{absent}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rate >= 90 ? "bg-green-100 text-green-700" :
                            rate >= 70 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {rate.toFixed(0)} %
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/attendance/${s.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" /> Voir
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale création */}
      {showCreate && <CreateAttendanceModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
