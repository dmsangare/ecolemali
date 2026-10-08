import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User, GraduationCap, Users, FileText, Wallet, Heart, Calendar,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState } from "@/components/shared";
import { Button, Card, CardContent } from "@/components/ui";
import { useStudentDetail } from "@/hooks/students";
import { useAuth } from "@/contexts/AuthContext";
import { StudentHeader } from "./components/StudentHeader";
import { IdentityTab } from "./components/tabs/IdentityTab";
import { SchoolTab } from "./components/tabs/SchoolTab";
import { FamilyTab } from "./components/tabs/FamilyTab";
import { DocumentsTab } from "./components/tabs/DocumentsTab";
import { FinanceTab } from "./components/tabs/FinanceTab";
import { DisciplineTab } from "./components/tabs/DisciplineTab";
import { AttendanceTab } from "./components/tabs/AttendanceTab";

export function StudentDetailPage() {
  const { hasPermission } = useAuth();
  const canViewFinance = hasPermission("invoice:view");

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, error } = useStudentDetail(id);
  const [activeTab, setActiveTab] = useState("identity");

  const handlePrint = () => {
    toast.info("Impression de la fiche a implementer dans la prochaine version");
  };

  if (isLoading) {
    return <LoadingState message="Chargement de la fiche eleve..." />;
  }

  if (error || !student) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-medium">Eleve introuvable</p>
            <p className="text-sm text-muted-foreground">
              Cet eleve n existe pas ou a ete supprime.
            </p>
            <Button variant="outline" onClick={() => navigate("/students")}>
              Retour a la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header avec badges et actions */}
      <StudentHeader student={student} onPrint={handlePrint} />

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
            <TabsTrigger value="identity" className="flex items-center gap-2 whitespace-nowrap">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Identite</span>
            </TabsTrigger>
            <TabsTrigger value="school" className="flex items-center gap-2 whitespace-nowrap">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Scolarite</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Famille</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            {canViewFinance && (
              <TabsTrigger value="finance" className="flex items-center gap-2 whitespace-nowrap">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Finances</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="discipline" className="flex items-center gap-2 whitespace-nowrap">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Sante</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Absences</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="identity" className="space-y-6">
          <IdentityTab student={student} />
        </TabsContent>

        <TabsContent value="school" className="space-y-6">
          <SchoolTab student={student} />
        </TabsContent>

        <TabsContent value="family" className="space-y-6">
          <FamilyTab student={student} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentsTab studentId={student.id} />
        </TabsContent>

        {canViewFinance && (
          <TabsContent value="finance" className="space-y-6">
            <FinanceTab student={student} />
          </TabsContent>
        )}

        <TabsContent value="discipline" className="space-y-6">
          <DisciplineTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <AttendanceTab studentId={student.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
