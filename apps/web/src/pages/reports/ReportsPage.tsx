import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, DollarSign, Users, GraduationCap, AlertCircle, TrendingUp, Award, Calendar, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { reportsApi } from "@/api/reports";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ExportMenu } from "@/components/export/ExportMenu";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const CATEGORY_LABELS: Record<string, string> = {
  INSCRIPTION: "Inscription",
  SCOLARITE: "Scolarité",
  CANTINE: "Cantine",
  TRANSPORT: "Transport",
  FOURNITURES: "Fournitures",
  AUTRE: "Autre",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces",
  TRANSFER: "Virement",
  CHECK: "Chèque",
  MOBILE_MONEY: "Mobile Money",
  OTHER: "Autre",
};

type Tab = "overview" | "financial" | "unpaid" | "students" | "pedagogical" | "attendance";

function KPI({ icon: Icon, label, value, sub, color = "blue" }: any) {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>("overview");

  const { data: overview, isLoading: l1 } = useQuery({ queryKey: ["rpt", "overview"], queryFn: () => reportsApi.dashboard() });
  const { data: financial, isLoading: l2 } = useQuery({ queryKey: ["rpt", "financial"], queryFn: () => reportsApi.financial(), enabled: tab === "financial" || tab === "overview" });
  const { data: unpaid, isLoading: l3 } = useQuery({ queryKey: ["rpt", "unpaid"], queryFn: () => reportsApi.unpaid(), enabled: tab === "unpaid" });
  const { data: students, isLoading: l4 } = useQuery({ queryKey: ["rpt", "students"], queryFn: () => reportsApi.students(), enabled: tab === "students" || tab === "overview" });
  const { data: pedagogical, isLoading: l5 } = useQuery({ queryKey: ["rpt", "pedagogical"], queryFn: () => reportsApi.pedagogical(), enabled: tab === "pedagogical" });
  const { data: attendance, isLoading: l6 } = useQuery({ queryKey: ["rpt", "attendance"], queryFn: () => reportsApi.attendance(), enabled: tab === "attendance" || tab === "overview" });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { id: "financial", label: "Financier", icon: DollarSign },
    { id: "unpaid", label: "Impayés", icon: AlertCircle },
    { id: "students", label: "Effectifs", icon: Users },
    { id: "pedagogical", label: "Pédagogique", icon: GraduationCap },
    { id: "attendance", label: "Présences", icon: Calendar },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Rapports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyses et statistiques de votre établissement
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 flex items-center gap-2 text-sm font-medium border-b-2 transition ${
              tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {l1 ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : (
            <>
              <div className="grid grid-cols-4 gap-4">
                <KPI icon={Users} label="Élèves" value={overview?.studentsCount ?? 0} sub={`${overview?.genderSplit?.boys ?? 0} G / ${overview?.genderSplit?.girls ?? 0} F`} color="blue" />
                <KPI icon={GraduationCap} label="Enseignants" value={overview?.teachersCount ?? 0} color="purple" />
                <KPI icon={BarChart3} label="Classes" value={overview?.classesCount ?? 0} color="amber" />
                <KPI icon={Calendar} label="Taux présence" value={`${overview?.attendanceRate ?? 0} %`} color="green" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <KPI icon={TrendingUp} label="Recettes" value={formatCurrency(overview?.revenueAmount ?? 0)} color="green" />
                <KPI icon={AlertCircle} label="Impayés" value={formatCurrency(overview?.unpaidAmount ?? 0)} color="red" />
                <KPI icon={DollarSign} label="Total facturé" value={formatCurrency(overview?.totalBilled ?? 0)} color="blue" />
                <KPI icon={Award} label="Taux recouvrement" value={`${overview?.totalBilled ? ((overview.revenueAmount / overview.totalBilled) * 100).toFixed(1) : 0} %`} color="purple" />
              </div>
            </>
          )}
        </div>
      )}

      {tab === "financial" && (
        <div className="space-y-4">
          {l2 ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : financial && (
            <>
              <div className="flex justify-end">
                <ExportMenu
                  filename="rapport-financier"
                  csvRows={financial.byMonth ?? []}
                  excelSheets={[
                    { name: "Recettes par mois", rows: financial.byMonth ?? [] },
                    { name: "Par catégorie", rows: financial.byCategory ?? [] },
                    { name: "Par méthode", rows: financial.byMethod ?? [] },
                  ]}
                  pdfEndpoint="/reports/pdf/financial"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <KPI icon={DollarSign} label="Total facturé" value={formatCurrency(financial.totalBilled)} color="blue" />
                <KPI icon={TrendingUp} label="Encaissé" value={formatCurrency(financial.totalPaid)} color="green" />
                <KPI icon={AlertCircle} label="Impayés" value={formatCurrency(financial.totalUnpaid)} color="red" />
                <KPI icon={Award} label="Taux recouvrement" value={`${financial.recoveryRate.toFixed(1)} %`} color="purple" />
              </div>

              <Card>
                <CardHeader><CardTitle>Recettes par mois</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financial.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Bar dataKey="amount" fill="#3b82f6" name="Recettes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Par catégorie</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={financial.byCategory.map((c: any) => ({ name: CATEGORY_LABELS[c.category] ?? c.category, value: c.amount }))} dataKey="value" nameKey="name" outerRadius={80} label>
                          {financial.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Par méthode</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={(financial.byMethod ?? []).map((m: any) => ({ name: METHOD_LABELS[m.method] ?? m.method, value: m.total }))} dataKey="value" nameKey="name" outerRadius={80} label>
                          {(financial.byMethod ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "unpaid" && (
        <div className="space-y-4">
          {l3 ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : unpaid && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <KPI icon={AlertCircle} label="Total impayés" value={formatCurrency(unpaid.totalOutstanding)} color="red" />
                <KPI icon={BarChart3} label="Nombre factures" value={unpaid.count} color="amber" />
              </div>

              <Card>
                <CardHeader><CardTitle>Impayés par classe</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={unpaid.byClass}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="className" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Bar dataKey="total" fill="#ef4444" name="Impayés" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>Détail ({unpaid.count})</CardTitle>
                  <ExportMenu
                    filename="rapport-impayes"
                    csvRows={unpaid.items}
                    excelSheets={[
                      { name: "Détail impayés", rows: unpaid.items },
                      { name: "Par classe", rows: unpaid.byClass },
                    ]}
                    pdfEndpoint="/reports/pdf/unpaid"
                  />
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50 text-left text-xs uppercase">
                      <tr>
                        <th className="p-2">Facture</th><th className="p-2">Élève</th><th className="p-2">Classe</th>
                        <th className="p-2 text-right">Total</th><th className="p-2 text-right">Payé</th><th className="p-2 text-right">Reste</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaid.items.slice(0, 50).map((i: any) => (
                        <tr key={i.id} className="border-b">
                          <td className="p-2 font-mono text-xs">{i.number}</td>
                          <td className="p-2">{i.studentName}</td>
                          <td className="p-2">{i.className}</td>
                          <td className="p-2 text-right">{formatCurrency(i.totalAmount)}</td>
                          <td className="p-2 text-right text-green-600">{formatCurrency(i.paidAmount)}</td>
                          <td className="p-2 text-right font-semibold text-red-600">{formatCurrency(i.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "students" && (
        <div className="space-y-4">
          {l4 ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : students && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <KPI icon={Users} label="Total élèves" value={students.total} color="blue" />
                <KPI icon={Users} label="Garçons" value={students.boys} color="blue" />
                <KPI icon={Users} label="Filles" value={students.girls} color="purple" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Répartition par sexe</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={[{ name: "Garçons", value: students.boys }, { name: "Filles", value: students.girls }]} dataKey="value" nameKey="name" outerRadius={80} label>
                          <Cell fill="#3b82f6" />
                          <Cell fill="#ec4899" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Par niveau</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={students.byLevel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Élèves" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Détail par classe</CardTitle>
                  <ExportMenu
                    filename="rapport-effectifs"
                    csvRows={students.byClass}
                    excelSheets={[
                      { name: "Par classe", rows: students.byClass },
                      { name: "Par niveau", rows: students.byLevel },
                    ]}
                    pdfEndpoint="/reports/pdf/students"
                  />
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50 text-left text-xs uppercase">
                      <tr>
                        <th className="p-2">Classe</th><th className="p-2">Niveau</th>
                        <th className="p-2 text-right">Total</th><th className="p-2 text-right">G</th><th className="p-2 text-right">F</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.byClass.map((c: any) => (
                        <tr key={c.className} className="border-b">
                          <td className="p-2 font-medium">{c.className}</td>
                          <td className="p-2 text-muted-foreground">{c.levelName}</td>
                          <td className="p-2 text-right font-semibold">{c.count}</td>
                          <td className="p-2 text-right">{c.boys}</td>
                          <td className="p-2 text-right">{c.girls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "pedagogical" && (
        <div className="space-y-4">
          {l5 ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : pedagogical && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <KPI icon={GraduationCap} label="Notes saisies" value={pedagogical.totalGrades} color="blue" />
                <KPI icon={Award} label="Taux de réussite" value={`${pedagogical.successRate.toFixed(1)} %`} color="green" />
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Moyennes par matière</CardTitle>
                  <ExportMenu
                    filename="rapport-pedagogique"
                    csvRows={pedagogical.bySubject}
                    excelSheets={[
                      { name: "Par matière", rows: pedagogical.bySubject },
                      { name: "Par classe", rows: pedagogical.byClass },
                    ]}
                    pdfEndpoint="/reports/pdf/pedagogical"
                  />
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pedagogical.bySubject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="code" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => `${v} %`} />
                      <Bar dataKey="avgPct" fill="#8b5cf6" name="Moyenne %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Détail par matière</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50 text-left text-xs uppercase">
                      <tr>
                        <th className="p-2">Matière</th><th className="p-2 text-right">Notes</th>
                        <th className="p-2 text-right">Moy.</th><th className="p-2 text-right">Min</th><th className="p-2 text-right">Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedagogical.bySubject.map((s: any) => (
                        <tr key={s.code} className="border-b">
                          <td className="p-2 font-medium">{s.subject}</td>
                          <td className="p-2 text-right">{s.count}</td>
                          <td className="p-2 text-right font-semibold">{s.avgPct} %</td>
                          <td className="p-2 text-right text-red-600">{s.minPct} %</td>
                          <td className="p-2 text-right text-green-600">{s.maxPct} %</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-4">
          {l6 ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : attendance && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <KPI icon={Calendar} label="Sessions" value={attendance.sessionsCount} color="blue" />
                <KPI icon={Users} label="Présents" value={attendance.present} color="green" />
                <KPI icon={AlertCircle} label="Absents" value={attendance.absent} color="red" />
                <KPI icon={TrendingUp} label="Taux présence" value={`${attendance.presenceRate} %`} color="green" />
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Taux de présence par classe</CardTitle>
                  <ExportMenu
                    filename="rapport-presences"
                    csvRows={attendance.byClass}
                    excelSheets={[{ name: "Présences par classe", rows: attendance.byClass }]}
                    pdfEndpoint="/reports/pdf/attendance"
                  />
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendance.byClass}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="className" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => `${v} %`} />
                      <Bar dataKey="presenceRate" fill="#10b981" name="Taux %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Détail par classe</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50 text-left text-xs uppercase">
                      <tr>
                        <th className="p-2">Classe</th><th className="p-2 text-right">Sessions</th>
                        <th className="p-2 text-right">Présents</th><th className="p-2 text-right">Absents</th>
                        <th className="p-2 text-right">Retards</th><th className="p-2 text-right">Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.byClass.map((c: any) => (
                        <tr key={c.className} className="border-b">
                          <td className="p-2 font-medium">{c.className}</td>
                          <td className="p-2 text-right">{c.sessionsCount}</td>
                          <td className="p-2 text-right text-green-600">{c.present}</td>
                          <td className="p-2 text-right text-red-600">{c.absent}</td>
                          <td className="p-2 text-right text-amber-600">{c.late}</td>
                          <td className="p-2 text-right font-semibold">{c.presenceRate} %</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
