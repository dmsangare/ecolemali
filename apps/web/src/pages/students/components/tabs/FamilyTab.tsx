import { Link } from "react-router-dom";
import {
  Users as UsersIcon, Phone, Mail, Briefcase, User as UserIcon,
  AlertCircle, Heart, Home, ExternalLink, UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, AvatarFallback } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { initials } from "@/lib/formatters";
import { useSiblings } from "@/hooks/students";
import type { StudentDetail, StudentGuardianRelation } from "@/types/student";

interface FamilyTabProps {
  student: StudentDetail;
}

const RELATION_LABELS: Record<string, string> = {
  FATHER: "Pere",
  MOTHER: "Mere",
  TUTOR: "Tuteur",
  OTHER: "Autre",
};

const RELATION_ICONS: Record<string, React.ReactNode> = {
  FATHER: <UserIcon className="h-4 w-4" />,
  MOTHER: <Heart className="h-4 w-4" />,
  TUTOR: <UserPlus className="h-4 w-4" />,
  OTHER: <UserIcon className="h-4 w-4" />,
};

export function FamilyTab({ student }: FamilyTabProps) {
  const { data: siblings, isLoading: loadingSiblings } = useSiblings(student.id);

  const father = student.guardians?.find(
    (g) => g.guardian.relationType === "FATHER",
  );
  const mother = student.guardians?.find(
    (g) => g.guardian.relationType === "MOTHER",
  );
  const otherGuardians = student.guardians?.filter(
    (g) => g.guardian.relationType !== "FATHER" && g.guardian.relationType !== "MOTHER",
  ) || [];

  return (
    <div className="space-y-6">
      {/* Père */}
      {father ? (
        <GuardianCard relation={father} relationLabel="Pere" />
      ) : (
        <EmptyGuardianCard label="Pere" />
      )}

      {/* Mère */}
      {mother ? (
        <GuardianCard relation={mother} relationLabel="Mere" />
      ) : (
        <EmptyGuardianCard label="Mere" />
      )}

      {/* Autres tuteurs */}
      {otherGuardians.map((g, idx) => (
        <GuardianCard
          key={idx}
          relation={g}
          relationLabel={RELATION_LABELS[g.guardian.relationType] || "Tuteur"}
        />
      ))}

      {/* Fratrie à l'école */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="h-4 w-4 text-primary" />
            Fratrie a l ecole
            {siblings && siblings.length > 0 && (
              <StatusBadge label={`${siblings.length}`} variant="info" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSiblings ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Recherche en cours...
            </p>
          ) : siblings && siblings.length > 0 ? (
            <div className="space-y-3">
              {siblings.map((sib) => {
                const enrollment = sib.enrollments?.[0];
                return (
                  <Link
                    key={sib.id}
                    to={`/students/${sib.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {initials(sib.firstName, sib.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {sib.lastName} {sib.firstName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {sib.matricule}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {enrollment?.class && (
                        <StatusBadge
                          label={enrollment.class.name}
                          variant="info"
                        />
                      )}
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Aucun frere ou soeur inscrit dans l etablissement
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cette section liste les élèves partageant le meme tuteur
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts d'urgence */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-900">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            Contacts d urgence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.guardians && student.guardians.length > 0 ? (
            <div className="space-y-2">
              {student.guardians
                .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                .map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        {g.guardian.lastName} {g.guardian.firstName}
                        {g.isPrimary && (
                          <StatusBadge
                            label="Prioritaire"
                            variant="warning"
                            className="ml-2"
                          />
                        )}
                      </p>
                      <p className="text-xs text-orange-700">
                        {RELATION_LABELS[g.guardian.relationType] || ""}
                      </p>
                    </div>
                    <a
                      href={`tel:${g.guardian.phone}`}
                      className="flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900 hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {g.guardian.phone}
                    </a>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-orange-700">
              Aucun contact d urgence disponible
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Carte d'un tuteur.
 */
function GuardianCard({
  relation,
  relationLabel,
}: {
  relation: StudentGuardianRelation;
  relationLabel: string;
}) {
  const g = relation.guardian;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {RELATION_ICONS[g.relationType] || <UserIcon className="h-4 w-4" />}
          {relationLabel}
          {relation.isPrimary && (
            <StatusBadge label="Principal" variant="success" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials(g.firstName, g.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-lg font-bold">
              {g.lastName} {g.firstName}
            </p>
            {g.profession && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Briefcase className="h-3 w-3" />
                {g.profession}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 pt-3 border-t">
          <ContactItem
            icon={<Phone className="h-3 w-3" />}
            label="Telephone"
            value={g.phone}
            href={`tel:${g.phone}`}
          />
          {g.email && (
            <ContactItem
              icon={<Mail className="h-3 w-3" />}
              label="Email"
              value={g.email}
              href={`mailto:${g.email}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyGuardianCard({ label }: { label: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Non renseigne.{" "}
          <Link
            to="#"
            className="text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              alert("Modification a venir dans une prochaine version");
            }}
          >
            Ajouter un {label.toLowerCase()}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </>
  );

  if (href) {
    return (
      <a href={href} className="block hover:text-primary transition-colors">
        {content}
      </a>
    );
  }

  return <div>{content}</div>;
}
