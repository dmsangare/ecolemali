import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  MapPin,
  Users as UsersIcon,
  FileText,
  Receipt,
  Pencil,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { useStudent } from "@/hooks/students";
import { formatDate, initials, formatCurrency } from "@/lib/formatters";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  Separator,
} from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  TRANSFERRED: "Transfere",
  GRADUATED: "Diplome",
  DROPPED: "Abandon",
  SUSPENDED: "Suspendu",
};

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, error } = useStudent(id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Eleve introuvable</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/students")}>
              Retour a la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tete */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/students">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials(student.firstName, student.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {student.lastName} {student.firstName}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                {student.matricule}
              </p>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link to={`/students/${student.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      {/* Grille */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Identite
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Nom complet" value={`${student.lastName} ${student.firstName}`} />
              <InfoItem label="Sexe" value={student.gender === "M" ? "Masculin" : "Feminin"} />
              <InfoItem label="Date de naissance" value={formatDate(student.birthDate)} />
              <InfoItem label="Lieu de naissance" value={student.birthPlace || "—"} />
              <InfoItem label="Nationalite" value={student.nationality || "—"} />
              <InfoItem
                label="Statut"
                value={STATUS_LABELS[student.status] || student.status}
              />
            </CardContent>
          </Card>

          {/* Coordonnees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Coordonnees
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Telephone" value={student.phone || "—"} />
              <InfoItem label="Adresse" value={student.address || "—"} />
            </CardContent>
          </Card>

          {/* Tuteurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Parents / Tuteurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!student.guardians || student.guardians.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun tuteur associe a cet eleve
                </p>
              ) : (
                <div className="space-y-3">
                  {student.guardians.map((sg, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {sg.guardian.lastName} {sg.guardian.firstName}
                          {sg.isPrimary && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sg.guardian.phone} — {sg.guardian.relationType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne laterale */}
        <div className="space-y-6">
          {/* Scolarite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Scolarite
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!student.enrollments || student.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune inscription</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {student.enrollments[0].class?.name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.enrollments[0].level?.name || "—"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          {student._count && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatLine icon={Receipt} label="Factures" value={student._count.invoices} />
                <StatLine icon={Receipt} label="Paiements" value={student._count.payments} />
                <StatLine icon={FileText} label="Bulletins" value={student._count.reportCards} />
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!student.documents || student.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun document</p>
              ) : (
                <div className="space-y-2">
                  {student.documents.slice(0, 5).map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {doc.fileName || doc.type}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function StatLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
