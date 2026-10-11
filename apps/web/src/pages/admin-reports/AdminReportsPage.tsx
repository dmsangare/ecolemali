import {
  FileText, LayoutDashboard, Archive, Calendar, GraduationCap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminReportsDashboardPage } from "./AdminReportsDashboardPage";
import { AdminReportsListPage } from "./AdminReportsListPage";
import { AdminReportsArchivesPage } from "./AdminReportsArchivesPage";
import { AdminReportsDeadlinesPage } from "./AdminReportsDeadlinesPage";
import { StateExamSessionsPage } from "@/pages/state-exam-dossiers/StateExamSessionsPage";

export function AdminReportsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Rapports administratifs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Préparation, validation, transmission et archivage des rapports aux autorités
        </p>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="flex flex-wrap justify-center gap-1 w-full max-w-5xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rapports
          </TabsTrigger>
          <TabsTrigger value="archives" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archives
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Échéances
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Examens d'État
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminReportsDashboardPage />
        </TabsContent>

        <TabsContent value="reports">
          <AdminReportsListPage />
        </TabsContent>

        <TabsContent value="archives">
          <AdminReportsArchivesPage />
        </TabsContent>

        <TabsContent value="deadlines">
          <AdminReportsDeadlinesPage />
        </TabsContent>

        <TabsContent value="exams">
          <StateExamSessionsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
