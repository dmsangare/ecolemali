import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Pencil, Printer, Phone, AlertCircle, GraduationCap, Award,
} from "lucide-react";
import { Button, Avatar, AvatarFallback } from "@/components/ui";
import { StatusBadge, BadgeVariant } from "@/components/shared";
import { initials, formatCurrency, formatDate } from "@/lib/formatters";
import type { StudentDetail } from "@/types/student";

interface StudentHeaderProps {
  student: StudentDetail;
  onPrint?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  TRANSFERRED: "Transfere",
  GRADUATED: "Diplome",
  DROPPED: "Abandon",
  SUSPENDED: "Suspendu",
};

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  TRANSFERRED: "info",
  GRADUATED: "purple",
  DROPPED: "danger",
  SUSPENDED: "warning",
};

const CYCLE_LABELS: Record<string, string> = {
  PREMIER_CYCLE: "1er cycle",
  DEUXIEME_CYCLE: "2e cycle",
  LYCEE: "Lycee",
};

export function StudentHeader({ student, onPrint }: StudentHeaderProps) {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("student:update");
  const canViewFinance = hasPermission("invoice:view");

  const currentEnrollment = student.enrollments?.find(
    (e) => e.academicYear?.isCurrent,
  ) || student.enrollments?.[0];

  const levelCode = currentEnrollment?.level?.code;
  const isDEFCandidate = levelCode === "9EME";
  const isBACCandidate = levelCode === "12EME";

  const unpaidAmount = Number(student.unpaidAmount || 0);

  return (
    <div className="space-y-4">
      {/* Bouton retour */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/students">
            <ArrowLeft className="h-4 w-4" />
            Retour a la liste
          </Link>
        </Button>
      </div>

      {/* Carte principale */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          {/* Infos eleve */}
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials(student.firstName, student.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {student.lastName} {student.firstName}
                </h1>
                <p className="text-sm font-mono text-muted-foreground mt-0.5">
                  {student.matricule}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {student.enrollmentStatus && (
                  <StatusBadge
                    label={
                      student.enrollmentStatus === "NOUVEAU"
                        ? "Nouveau"
                        : student.enrollmentStatus === "ANCIEN"
                        ? `Ancien${student.yearsEnrolled ? ` (${student.yearsEnrolled} ans)` : ""}`
                        : "Redoublant"
                    }
                    variant={
                      student.enrollmentStatus === "NOUVEAU"
                        ? "success"
                        : student.enrollmentStatus === "ANCIEN"
                        ? "info"
                        : "warning"
                    }
                    icon={
                      student.enrollmentStatus === "NOUVEAU" ? (
                        <GraduationCap className="h-3 w-3" />
                      ) : student.enrollmentStatus === "REDOUBLANT" ? (
                        <Award className="h-3 w-3" />
                      ) : undefined
                    }
                  />
                )}

                {currentEnrollment?.class && (
                  <StatusBadge
                    label={currentEnrollment.class.name}
                    variant="info"
                  />
                )}

                {currentEnrollment?.level?.cycle && (
                  <StatusBadge
                    label={
                      CYCLE_LABELS[currentEnrollment.level.cycle] ||
                      currentEnrollment.level.cycle
                    }
                    variant="gray"
                  />
                )}

                <StatusBadge
                  label={STATUS_LABELS[student.status] || student.status}
                  variant={STATUS_VARIANTS[student.status] || "gray"}
                />

                {isDEFCandidate && (
                  <StatusBadge
                    label="Candidat DEF"
                    variant="purple"
                    icon={<Award className="h-3 w-3" />}
                  />
                )}

                {isBACCandidate && (
                  <StatusBadge
                    label="Candidat BAC"
                    variant="purple"
                    icon={<Award className="h-3 w-3" />}
                  />
                )}
              </div>

              {/* Infos secondaires */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {student.guardians?.[0]?.guardian.phone || "Aucun contact"}
                </span>
                <span>
                  Inscrit le {formatDate(student.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onPrint}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            {canUpdate && (
              <Button asChild>
                <Link to={`/students/${student.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Bandeau impayés */}
        {canViewFinance && unpaidAmount > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                Solde impaye : {formatCurrency(unpaidAmount)}
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Consultez l onglet Finances pour le detail
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <Link to={`/invoices?studentId=${student.id}`}>
                Voir les factures
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
