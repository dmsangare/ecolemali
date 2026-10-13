import { useState } from "react";
import { useForm } from "react-hook-form";
import { School, Loader2, Sparkles, Building2, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateSchool } from "@/hooks/school/useSchool";
import type { CreateSchoolInput } from "@/types/school";

const TYPES = [
  { value: "FONDAMENTAL", label: "Fondamental (1er cycle)" },
  { value: "PREMIER_CYCLE", label: "Premier cycle" },
  { value: "DEUXIEME_CYCLE", label: "Deuxieme cycle" },
  { value: "LYCEE", label: "Lycee" },
  { value: "FONDAMENTAL_LYCEE", label: "Fondamental & Lycee" },
] as const;

const STATUSES = [
  { value: "PRIVE", label: "Prive" },
  { value: "PUBLIC", label: "Public" },
  { value: "CONFESSIONNEL", label: "Confessionnel" },
  { value: "LAIC", label: "Laic" },
] as const;

export function InitSchoolPage() {
  const { refreshUser } = useAuth();
  const createMutation = useCreateSchool();
  const [step, setStep] = useState<"form" | "done">("form");

  const { register, handleSubmit, formState: { errors } } = useForm<CreateSchoolInput>({
    defaultValues: {
      code: "",
      name: "",
      type: "FONDAMENTAL_LYCEE",
      status: "PRIVE",
      sigle: "",
      address: "",
      phone: "",
      email: "",
      directorName: "",
      motto: "",
    },
  });

  const onSubmit = async (data: CreateSchoolInput) => {
    try {
      await createMutation.mutateAsync(data);
      await refreshUser();
      setStep("done");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch {
      // toast deja gere par le hook
    }
  };

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Etablissement cree !</h2>
            <p className="text-sm text-muted-foreground">
              Redirection vers votre tableau de bord...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="max-w-2xl w-full my-8">
        <CardHeader className="text-center border-b">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bienvenue sur SIS-MALI</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Pour demarrer, creons votre etablissement. Vous pourrez modifier
            ces informations a tout moment.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* IDENTITE */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Identite
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nom complet de l'etablissement *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Ecole Les Aiglons"
                    {...register("name", { required: "Obligatoire" })}
                  />
                  {errors.name && <p className="text-xs text-destructive">Obligatoire</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code court (unique) *</Label>
                  <Input
                    id="code"
                    placeholder="Ex: AIGLONS"
                    className="font-mono uppercase"
                    {...register("code", { required: "Obligatoire" })}
                  />
                  {errors.code && <p className="text-xs text-destructive">Obligatoire</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sigle">Sigle</Label>
                  <Input
                    id="sigle"
                    placeholder="Ex: AIG"
                    className="font-mono uppercase"
                    {...register("sigle")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type d'etablissement *</Label>
                  <select
                    id="type"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    {...register("type", { required: true })}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <select
                    id="status"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    {...register("status", { required: true })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="directorName">Nom du directeur</Label>
                  <Input id="directorName" {...register("directorName")} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motto">Devise / Slogan</Label>
                  <Input
                    id="motto"
                    placeholder="Ex: Discipline - Travail - Reussite"
                    {...register("motto")}
                  />
                </div>
              </div>
            </div>

            {/* CONTACT */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telephone</Label>
                  <Input
                    id="phone"
                    placeholder="+223 XX XX XX XX"
                    {...register("phone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Adresse
                  </Label>
                  <Input id="address" {...register("address")} />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creation en cours...
                </>
              ) : (
                <>
                  <School className="h-4 w-4 mr-2" />
                  Creer mon etablissement
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
