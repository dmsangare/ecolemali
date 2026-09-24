import { useState } from "react";
import { Users, Heart, Phone, Briefcase, UserPlus, Info } from "lucide-react";
import { Input, Label, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { GuardianSearch } from "../GuardianSearch";
import type { Guardian } from "@/hooks/guardians";

export interface FamilyData {
  father: {
    selected: Guardian | null;
    firstName: string;
    lastName: string;
    phone: string;
    profession: string;
    createNew: boolean;
  };
  mother: {
    selected: Guardian | null;
    firstName: string;
    lastName: string;
    phone: string;
    profession: string;
    createNew: boolean;
  };
  primaryGuardianType: "FATHER" | "MOTHER";
}

interface Step3FamilyProps {
  data: FamilyData;
  onChange: (data: Partial<FamilyData>) => void;
  errors: Record<string, string>;
}

export function Step3Family({ data, onChange, errors }: Step3FamilyProps) {
  const updateFather = (updates: Partial<FamilyData["father"]>) => {
    onChange({ father: { ...data.father, ...updates } });
  };

  const updateMother = (updates: Partial<FamilyData["mother"]>) => {
    onChange({ mother: { ...data.mother, ...updates } });
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Information importante</p>
          <p className="text-xs mt-1 text-blue-700">
            Au moins un parent ou tuteur est obligatoire. Vous pouvez rechercher
            un tuteur existant (frere/soeur deja inscrit) pour eviter les doublons.
          </p>
        </div>
      </div>

      {/* Père */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Pere
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data.father.createNew && !data.father.selected ? (
            <GuardianSearch
              label="Rechercher le pere"
              relationType="FATHER"
              selected={data.father.selected}
              onSelect={(g) => updateFather({ selected: g })}
              onClear={() => updateFather({ selected: null })}
              onCreateNew={() => updateFather({ createNew: true })}
            />
          ) : data.father.selected ? (
            <div className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
              <div>
                <p className="text-sm font-medium">
                  {data.father.selected.lastName} {data.father.selected.firstName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.father.selected.phone}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFather({ selected: null })}
              >
                Changer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary">
                  Creation d un nouveau pere
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFather({ createNew: false })}
                >
                  Rechercher un existant
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={data.father.lastName}
                    onChange={(e) => updateFather({ lastName: e.target.value })}
                    placeholder="BAH"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prenom</Label>
                  <Input
                    value={data.father.firstName}
                    onChange={(e) => updateFather({ firstName: e.target.value })}
                    placeholder="Moussa"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Telephone
                  </Label>
                  <Input
                    value={data.father.phone}
                    onChange={(e) => updateFather({ phone: e.target.value })}
                    placeholder="+223 70 11 22 33"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> Profession
                  </Label>
                  <Input
                    value={data.father.profession}
                    onChange={(e) => updateFather({ profession: e.target.value })}
                    placeholder="Commercant"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mère */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-pink-500" />
            Mere
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data.mother.createNew && !data.mother.selected ? (
            <GuardianSearch
              label="Rechercher la mere"
              relationType="MOTHER"
              selected={data.mother.selected}
              onSelect={(g) => updateMother({ selected: g })}
              onClear={() => updateMother({ selected: null })}
              onCreateNew={() => updateMother({ createNew: true })}
            />
          ) : data.mother.selected ? (
            <div className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
              <div>
                <p className="text-sm font-medium">
                  {data.mother.selected.lastName} {data.mother.selected.firstName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.mother.selected.phone}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateMother({ selected: null })}
              >
                Changer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary">
                  Creation d une nouvelle mere
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateMother({ createNew: false })}
                >
                  Rechercher une existante
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={data.mother.lastName}
                    onChange={(e) => updateMother({ lastName: e.target.value })}
                    placeholder="KONE"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prenom</Label>
                  <Input
                    value={data.mother.firstName}
                    onChange={(e) => updateMother({ firstName: e.target.value })}
                    placeholder="Aminata"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Telephone
                  </Label>
                  <Input
                    value={data.mother.phone}
                    onChange={(e) => updateMother({ phone: e.target.value })}
                    placeholder="+223 76 44 55 66"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> Profession
                  </Label>
                  <Input
                    value={data.mother.profession}
                    onChange={(e) => updateMother({ profession: e.target.value })}
                    placeholder="Menagere"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tuteur principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" />
            Tuteur principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Qui sera le contact principal en cas d urgence ?
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label
              className={`flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                data.primaryGuardianType === "FATHER"
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="primaryGuardian"
                checked={data.primaryGuardianType === "FATHER"}
                onChange={() => onChange({ primaryGuardianType: "FATHER" })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Le Pere</span>
            </label>
            <label
              className={`flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                data.primaryGuardianType === "MOTHER"
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="primaryGuardian"
                checked={data.primaryGuardianType === "MOTHER"}
                onChange={() => onChange({ primaryGuardianType: "MOTHER" })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">La Mere</span>
            </label>
          </div>
          {errors.family && (
            <p className="text-xs text-destructive mt-3">{errors.family}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
