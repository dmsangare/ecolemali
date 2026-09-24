import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save, Building2, Mail, Phone, Globe, MapPin, Quote } from "lucide-react";
import { useSchool, useUpdateSchool } from "@/hooks/users";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui";

export function SchoolTab() {
  const { data: school, isLoading } = useSchool();
  const updateMutation = useUpdateSchool();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: "", sigle: "", motto: "", address: "", phone: "", email: "",
      website: "", directorName: "",
    },
  });

  useEffect(() => {
    if (school) {
      reset({
        name: school.name || "",
        sigle: school.sigle || "",
        motto: school.motto || "",
        address: school.address || "",
        phone: school.phone || "",
        email: school.email || "",
        website: school.website || "",
        directorName: school.directorName || "",
      });
    }
  }, [school, reset]);

  const onSubmit = async (data: any) => {
    if (!school) return;
    await updateMutation.mutateAsync({ id: school.id, dto: data });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Identite de l etablissement
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nom complet de l etablissement *</Label>
            <Input id="name" {...register("name", { required: true })} />
            {errors.name && (
              <p className="text-xs text-destructive">Champ obligatoire</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sigle">Sigle (pour les emails) *</Label>
            <Input
              id="sigle"
              placeholder="Ex: AIGLONS"
              {...register("sigle")}
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Exemple : si sigle = AIGLONS, les emails seront nom@aiglons.ml
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="directorName">Nom du directeur</Label>
            <Input id="directorName" {...register("directorName")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="motto" className="flex items-center gap-2">
              <Quote className="h-3 w-3" />
              Devise / Slogan de l ecole
            </Label>
            <Input
              id="motto"
              placeholder="Ex: Discipline — Travail — Reussite"
              {...register("motto")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Adresse complete</Label>
            <Input id="address" {...register("address")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-3 w-3" /> Telephone
            </Label>
            <Input id="phone" placeholder="+223 XX XX XX XX" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3 w-3" /> Email de contact
            </Label>
            <Input id="email" type="email" {...register("email")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-3 w-3" /> Site web
            </Label>
            <Input id="website" placeholder="https://..." {...register("website")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
