import {
  School, GraduationCap, Award, Users as UsersIcon, Calendar, User as UserIcon,
  CheckCircle2, XCircle, ArrowUpRight, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusBadge, BadgeVariant } from "@/components/shared";
import { formatDate } from "@/lib/formatters";
import type { StudentDetail, StudentPathway } from "@/types/student";

interface SchoolTabProps {
  student: StudentDetail;
}

const CYCLE_LABELS: Record<string, string> = {
  PREMIER_CYCLE: "Premier cycle (1ere - 6eme)",
  DEUXIEME_CYCLE: "Deuxieme cycle (7eme - 9eme)",
  LYCEE: "Lycee (10eme - 12eme)",
};

const RESULT_LABELS: Record<string, string> = {
  PASSED: "Admis",
  REPEATED: "Redouble",
  EXCLUDED: "Exclu",
  TRANSFERRED: "Transfere",
};

const RESULT_VARIANTS: Record<string, BadgeVariant> = {
  PASSED: "success",
  REPEATED: "warning",
  EXCLUDED: "danger",
  TRANSFERRED: "info",
};

export function SchoolTab({ student }: SchoolTabProps) {
  const currentEnrollment =
    student.enrollments?.find((e) => e.academicYear?.isCurrent) ||
    student.enrollments?.[0];

  const levelCode = currentEnrollment?.level?.code;
  const isDEFCandidate = levelCode === "9EME";
  const isBACCandidate = levelCode === "12EME";

  return (
    <div className="space-y-6">
      {/* Classe actuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <School className="h-4 w-4 text-primary" />
            Classe actuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentEnrollment?.class ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                    {currentEnrollment.class.code}
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {currentEnrollment.class.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentEnrollment.level?.name || ""}
                    </p>
                    {currentEnrollment.level?.cycle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {CYCLE_LABELS[currentEnrollment.level.cycle] || ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <StatusBadge
                    label={`Annee ${currentEnrollment.academicYear?.label || ""}`}
                    variant="info"
                  />
                  {currentEnrollment.academicYear?.isCurrent && (
                    <StatusBadge label="En cours" variant="success" />
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <InfoItem
                  label="Effectif de la classe"
                  value={`${student._count?.reportCards || 0} eleves`}
                  icon={<UsersIcon className="h-3 w-3" />}
                />
                <InfoItem
                  label="Date d inscription"
                  value={
                    currentEnrollment.enrollmentDate
                      ? formatDate(currentEnrollment.enrollmentDate)
                      : "—"
                  }
                  icon={<Calendar className="h-3 w-3" />}
                />
                <InfoItem
                  label="Statut"
                  value={student.status === "ACTIVE" ? "Actif" : student.status}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Aucune inscription active
            </p>
          )}
        </CardContent>
      </Card>

      {/* Badge DEF/BAC */}
      {(isDEFCandidate || isBACCandidate) && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Diplome en preparation
                </p>
                <p className="text-lg font-bold text-purple-900">
                  {isDEFCandidate ? "DEF 2027" : "BAC 2027"}
                </p>
                <p className="text-sm text-purple-700 mt-0.5">
                  {isDEFCandidate
                    ? "Diplome d Etudes Fondamentales"
                    : "Baccalaureat"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professeur principal */}
      {currentEnrollment?.class && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-primary" />
              Professeur principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Non affecte (a definir dans la fiche de la classe)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Parcours scolaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" />
            Parcours scolaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.pathways && student.pathways.length > 0 ? (
            <ParcoursTimeline pathways={student.pathways} />
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Aucun parcours enregistre
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Le parcours se construit au fil des annees
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}

/**
 * Timeline du parcours scolaire.
 */
function ParcoursTimeline({ pathways }: { pathways: StudentPathway[] }) {
  // Trier par annee (plus recent en premier)
  const sorted = [...pathways].sort((a, b) =>
    (b.academicYear?.label || "").localeCompare(a.academicYear?.label || ""),
  );

  return (
    <div className="space-y-4">
      {sorted.map((p, idx) => {
        const isFirst = idx === 0;
        const ResultIcon = p.result === "PASSED" ? CheckCircle2 : p.result === "REPEATED" ? RotateCcw : XCircle;

        return (
          <div key={p.id} className="relative flex gap-4">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  isFirst
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-muted-foreground/30"
                }`}
              >
                {p.result ? (
                  <ResultIcon className="h-5 w-5" />
                ) : (
                  <ArrowUpRight className="h-5 w-5" />
                )}
              </div>
              {idx < sorted.length - 1 && (
                <div className="w-0.5 flex-1 bg-muted-foreground/20 my-1" />
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <p className="text-sm font-medium">
                  {p.academicYear?.label || "—"}
                </p>
                {p.result && (
                  <StatusBadge
                    label={RESULT_LABELS[p.result] || p.result}
                    variant={RESULT_VARIANTS[p.result] || "gray"}
                  />
                )}
                {isFirst && !p.result && (
                  <StatusBadge label="En cours" variant="success" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {p.class && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                    {p.class.name}
                  </span>
                )}
                {p.level && <span>• {p.level.name}</span>}
              </div>

              {p.decision && (
                <p className="text-xs text-muted-foreground mt-1">
                  Decision : {p.decision}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
