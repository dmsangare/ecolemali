import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  School,
  Calendar,
  FileText,
  ClipboardCheck,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { useTeacherDashboard } from "@/hooks/dashboard";
import { TopStudentsPodium } from "@/components/dashboard";

export function TeacherDashboard() {
  const { data, isLoading } = useTeacherDashboard();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.hasProfile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucun profil enseignant associe a votre compte.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Contactez l'administration pour lier votre compte a une fiche enseignant.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    myClasses,
    mySubjects,
    totalStudents,
    upcomingAssessments,
    pendingAssessments,
  } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour, {data.teacher.firstName} {data.teacher.lastName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Voici un aperçu de vos classes et activites
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mes classes
            </CardTitle>
            <School className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myClasses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mes matieres
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mySubjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Élèves total
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/assessments">
            <FileText className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Saisir des notes</div>
              <div className="text-xs text-muted-foreground">
                {pendingAssessments.length} en attente
              </div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/attendance">
            <ClipboardCheck className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Faire l'appel</div>
              <div className="text-xs text-muted-foreground">
                Présences du jour
              </div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/report-cards">
            <FileText className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Bulletins</div>
              <div className="text-xs text-muted-foreground">
                Voir et generer
              </div>
            </div>
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mes classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <School className="h-4 w-4 text-primary" />
              Mes classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune classe assignee
              </p>
            ) : (
              <div className="space-y-2">
                {myClasses.map((c: any) => (
                  <Link
                    key={c.id}
                    to={`/classes/${c.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition"
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.level?.name} · {c.studentCount} eleves
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evaluations a venir */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Evaluations a venir (7 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAssessments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune evaluation a venir
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingAssessments.slice(0, 5).map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.class?.name} · {a.subject?.name}
                      </p>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      {new Date(a.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top élèves */}
      <TopStudentsPodium />
    </div>
  );
}
