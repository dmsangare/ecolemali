import { User, Calendar, MapPin, Flag, AlertCircle } from "lucide-react";
import { Input, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusBadge } from "@/components/shared";

export interface IdentityData {
  firstName: string;
  lastName: string;
  gender: "M" | "F" | "";
  birthDate: string;
  birthPlace: string;
  nationality: string;
  specialSituation: string;
}

interface Step1IdentityProps {
  data: IdentityData;
  onChange: (data: Partial<IdentityData>) => void;
  errors: Record<string, string>;
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function Step1Identity({ data, onChange, errors }: Step1IdentityProps) {
  const age = calculateAge(data.birthDate);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value.toUpperCase() })}
              placeholder="BAH"
              className={errors.lastName ? "border-destructive" : ""}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>

          {/* Prénom */}
          <div className="space-y-2">
            <Label htmlFor="firstName">
              Prenom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => {
                const v = e.target.value;
                onChange({
                  firstName: v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
                });
              }}
              placeholder="Oumou"
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>

          {/* Sexe */}
          <div className="space-y-2 md:col-span-2">
            <Label>
              Sexe <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-3">
              <label
                className={`flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer flex-1 transition-colors ${
                  data.gender === "M"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  checked={data.gender === "M"}
                  onChange={() => onChange({ gender: "M" })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Masculin</span>
              </label>
              <label
                className={`flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer flex-1 transition-colors ${
                  data.gender === "F"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  checked={data.gender === "F"}
                  onChange={() => onChange({ gender: "F" })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Feminin</span>
              </label>
            </div>
            {errors.gender && (
              <p className="text-xs text-destructive">{errors.gender}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Naissance
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {/* Date naissance */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">
              Date de naissance <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="birthDate"
                type="date"
                value={data.birthDate}
                onChange={(e) => onChange({ birthDate: e.target.value })}
                className={errors.birthDate ? "border-destructive" : ""}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            {age !== null && (
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={`${age} ans`}
                  variant={
                    age < 5 || age > 25 ? "warning" : "info"
                  }
                />
                {(age < 5 || age > 25) && (
                  <span className="text-xs text-orange-600">
                    Age inhabituel, verifiez la date
                  </span>
                )}
              </div>
            )}
            {errors.birthDate && (
              <p className="text-xs text-destructive">{errors.birthDate}</p>
            )}
          </div>

          {/* Lieu naissance */}
          <div className="space-y-2">
            <Label htmlFor="birthPlace" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Lieu de naissance
            </Label>
            <Input
              id="birthPlace"
              value={data.birthPlace}
              onChange={(e) => onChange({ birthPlace: e.target.value })}
              placeholder="Bamako"
            />
          </div>

          {/* Nationalité */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nationality" className="flex items-center gap-2">
              <Flag className="h-3 w-3" />
              Nationalite
            </Label>
            <Input
              id="nationality"
              value={data.nationality}
              onChange={(e) => onChange({ nationality: e.target.value })}
              placeholder="Malienne"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-primary" />
            Situation particuliere (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="specialSituation">
              Notes (handicap, allergie, etc.)
            </Label>
            <textarea
              id="specialSituation"
              value={data.specialSituation}
              onChange={(e) => onChange({ specialSituation: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Aucune situation particuliere a signaler"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
