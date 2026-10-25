import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  School,
  Calendar,
  FileText,
  ClipboardCheck,
  ArrowRight,
  Clock
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KpiCard,
  PageLoader,
  ErrorState,
  EmptyState,
  StatusBadge
} from "@/components/ui";
import { useTeacherDashboard } from "@/hooks/dashboard";
import { TopStudentsPodium } from "@/components/dashboard";
import { TeacherClassDistribution } from "./TeacherDashboard.stats";

export function TeacherDashboard() {
  const { data, isLoading, isError, refetch } = useTeacherDashboard();

  if (isLoading) return <PageLoader label="Chargement de votre espace..." />;
  
  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Impossible de charger le tableau de bord"
          description="Une erreur est survenue lors de la récupération de vos données."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data?.hasProfile) {
    return (
      <div className="p-6">
        <EmptyState
          title="Profil enseignant non configuré"
          description="Aucun profil enseignant n'est associé à votre compte. Contactez l'administration pour lier votre compte à une fiche enseignant."
        />
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {data.teacher.firstName} {data.teacher.lastName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici un aperçu de vos classes et activités.
          </p>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Mes classes"
          value={myClasses.length}
          hint="Classes assignées"
          icon={<School className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label="Mes matières"
          value={mySubjects.length}
          hint="Matières enseignées"
          icon={<BookOpen className="h-5 w-5" />}
          accent="info"
        />
        <KpiCard
          label="Total élèves"
          value={totalStudents}
          hint="Élèves dans mes classes"
          icon={<Users className="h-5 w-5" />}
          accent="success"
        />
      </div>

      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link to="/assessments" className="block group">
          <Card className="h-full transition-all group-hover:border-sis-brand group-hover:shadow-sis-md cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sis-brand-50 text-sis-brand">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Saisir des notes</p>
                <p className="text-xs text-muted-foreground">
                  {pendingAssessments.length} évaluation(s) en attente
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/attendance" className="block group">
          <Card className="h-full transition-all group-hover:border-sis-brand group-hover:shadow-sis-md cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sis-info-bg text-sis-info">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Faire l'appel</p>
                <p className="text-xs text-muted-foreground">Présences du jour</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/report-cards" className="block group">
          <Card className="h-full transition-all group-hover:border-sis-brand group-hover:shadow-sis-md cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sis-success-bg text-sis-success">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Bulletins</p>
                <p className="text-xs text-muted-foreground">Voir et générer</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Section Graphique + Listes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graphique (1/3) */}
        <div className="lg:col-span-1">
          <TeacherClassDistribution classes={myClasses} />
        </div>

        {/* Listes (2/3) */}
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          {/* Mes classes */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <School className="h-4 w-4 text-sis-brand" />
                Mes classes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {myClasses.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="Aucune classe" description="Aucune classe assignée." />
                </div>
              ) : (
                <div className="divide-y">
                  {myClasses.slice(0, 5).map((c: any) => (
                    <Link
                      key={c.id}
                      to={`/classes/${c.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition"
                    >
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.level?.name} · {c.studentCount} élèves
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Évaluations */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sis-info" />
                Prochaines évaluations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {upcomingAssessments.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="Aucune évaluation" description="Rien de prévu dans les 7 prochains jours." />
                </div>
              ) : (
                <div className="divide-y">
                  {upcomingAssessments.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.class?.name} · {a.subject?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge variant="info">
                          {new Date(a.date).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' })}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top élèves (composant existant conservé) */}
      <TopStudentsPodium />
    </div>
  );
}