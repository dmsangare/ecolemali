import { User, GraduationCap, Users, Receipt, Bell, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import type { IdentityData } from "./Step1Identity";
import type { SchoolData } from "./Step2School";
import type { FamilyData } from "./Step3Family";

interface Step4SummaryProps {
  identity: IdentityData;
  school: SchoolData;
  family: FamilyData;
  levels: any[];
  classes: any[];
  academicYears: any[];
  options: {
    generateInvoice: boolean;
    sendNotification: boolean;
  };
  onOptionsChange: (options: any) => void;
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const CYCLE_LABELS: Record<string, string> = {
  PREMIER_CYCLE: "Premier cycle",
  DEUXIEME_CYCLE: "Deuxieme cycle (DEF)",
  LYCEE: "Lycee (BAC)",
};

export function Step4Summary({
  identity,
  school,
  family,
  levels,
  classes,
  academicYears,
  options,
  onOptionsChange,
}: Step4SummaryProps) {
  const age = calculateAge(identity.birthDate);
  const level = levels.find((l) => l.id === school.levelId);
  const cls = classes.find((c) => c.id === school.classId);
  const year = academicYears.find((y) => y.id === school.academicYearId);

  return (
    <div className="space-y-6">
      {/* Info bannière */}
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <div className="text-sm text-green-900">
          <p className="font-medium">Verifiez les informations avant de valider</p>
          <p className="text-xs mt-1 text-green-700">
            Un matricule sera genere automatiquement. Vous pourrez ajouter les
            documents (acte de naissance, bulletins) plus tard.
          </p>
        </div>
      </div>

      {/* Identité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Identite de l eleve
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Nom complet" value={`${identity.lastName} ${identity.firstName}`} />
          <InfoRow
            label="Sexe"
            value={identity.gender === "M" ? "Masculin" : "Feminin"}
          />
          <InfoRow
            label="Date de naissance"
            value={
              identity.birthDate
                ? new Date(identity.birthDate).toLocaleDateString("fr-FR")
                : "—"
            }
          />
          <InfoRow label="Age" value={age !== null ? `${age} ans` : "—"} />
          <InfoRow label="Lieu de naissance" value={identity.birthPlace || "—"} />
          <InfoRow label="Nationalite" value={identity.nationality || "Malienne"} />
          {identity.specialSituation && (
            <div className="md:col-span-2">
              <InfoRow
                label="Situation particuliere"
                value={identity.specialSituation}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scolarité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" />
            Scolarite
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow
            label="Cycle"
            value={CYCLE_LABELS[school.cycle] || school.cycle || "—"}
          />
          <InfoRow label="Niveau" value={level?.name || "—"} />
          <InfoRow
            label="Classe"
            value={cls?.name ? `${cls.name}${cls.room ? ` — ${cls.room.name}` : ""}` : "—"}
          />
          <InfoRow label="Annee scolaire" value={year?.label || "—"} />
          {school.previousSchool && (
            <div className="md:col-span-2">
              <InfoRow label="Ecole precedente" value={school.previousSchool} />
            </div>
          )}
          <div className="md:col-span-2">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700">Matricule qui sera attribue</p>
              <p className="text-lg font-bold font-mono text-blue-900 mt-1">
                SIS-{new Date().getFullYear()}-XXXXXX
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Famille */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Famille / Tuteurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <GuardianInfo
            label="Pere"
            guardian={family.father.selected}
            inline={family.father}
            isPrimary={family.primaryGuardianType === "FATHER"}
          />
          <GuardianInfo
            label="Mere"
            guardian={family.mother.selected}
            inline={family.mother}
            isPrimary={family.primaryGuardianType === "MOTHER"}
          />
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Options apres creation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={options.generateInvoice}
              onChange={(e) =>
                onOptionsChange({ ...options, generateInvoice: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Generer la facture d inscription</p>
              <p className="text-xs text-muted-foreground">
                Cree automatiquement la facture avec les frais de la classe
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={options.sendNotification}
              onChange={(e) =>
                onOptionsChange({ ...options, sendNotification: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Notifier le parent</p>
              <p className="text-xs text-muted-foreground">
                Envoie un SMS/notification aux parents (optionnel)
              </p>
            </div>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function GuardianInfo({
  label,
  guardian,
  inline,
  isPrimary,
}: {
  label: string;
  guardian: any;
  inline: any;
  isPrimary: boolean;
}) {
  const data = guardian || inline;
  const fullName =
    data?.lastName || data?.firstName
      ? `${data.lastName || ""} ${data.firstName || ""}`.trim()
      : null;

  if (!fullName && !data?.phone) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground">{label} : Non renseigne</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50/50">
      <div>
        <p className="text-sm font-medium flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase">{label} :</span>
          {fullName || "—"}
          {isPrimary && <StatusBadge label="Principal" variant="success" />}
        </p>
        {data?.phone && (
          <p className="text-xs text-muted-foreground mt-0.5">{data.phone}</p>
        )}
        {data?.profession && (
          <p className="text-xs text-muted-foreground">{data.profession}</p>
        )}
      </div>
    </div>
  );
}
