import {
  User, Calendar, MapPin, Flag, Phone, Home, AlertCircle, Quote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { formatDate } from "@/lib/formatters";
import type { StudentDetail } from "@/types/student";

interface IdentityTabProps {
  student: StudentDetail;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function IdentityTab({ student }: IdentityTabProps) {
  const age = calculateAge(student.birthDate);

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <InfoItem label="Nom" value={student.lastName} />
          <InfoItem label="Prenom" value={student.firstName} />
          <InfoItem
            label="Sexe"
            value={student.gender === "M" ? "Masculin" : "Feminin"}
          />
          <InfoItem label="Age" value={`${age} ans`} />
          <InfoItem
            label="Date de naissance"
            value={formatDate(student.birthDate)}
            icon={<Calendar className="h-3 w-3" />}
          />
          <InfoItem
            label="Lieu de naissance"
            value={student.birthPlace || "Non renseigné"}
            icon={<MapPin className="h-3 w-3" />}
          />
          <InfoItem
            label="Nationalite"
            value={student.nationality || "Malienne"}
            icon={<Flag className="h-3 w-3" />}
          />
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" />
            Coordonnees
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <InfoItem
            label="Telephone"
            value={student.phone || "Non renseigné"}
            icon={<Phone className="h-3 w-3" />}
          />
          <InfoItem
            label="Adresse"
            value={student.address || "Non renseignee"}
            icon={<Home className="h-3 w-3" />}
          />
        </CardContent>
      </Card>

      {/* Situation particuliere */}
      {student.specialSituation && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-900">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Situation particuliere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-orange-900">
              {student.specialSituation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Devise (motto) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide">
                Devise de l etablissement
              </p>
              <p className="text-sm italic text-foreground mt-1">
                "Discipline — Travail — Reussite"
              </p>
            </div>
          </div>
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
