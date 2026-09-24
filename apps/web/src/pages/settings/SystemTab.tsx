import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save, Coins, Clock, GraduationCap } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/users";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui";

export function SystemTab() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      currency: "FCFA",
      locale: "fr-FR",
      timezone: "Africa/Bamako",
      gradingScale: "20",
      passMark: "10",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        currency: settings.currency,
        locale: settings.locale,
        timezone: settings.timezone,
        gradingScale: String(settings.gradingScale),
        passMark: String(settings.passMark),
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: any) => {
    await updateMutation.mutateAsync({
      currency: data.currency,
      locale: data.locale,
      timezone: data.timezone,
      gradingScale: data.gradingScale,
      passMark: data.passMark,
    });
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
            <Coins className="h-5 w-5" />
            Devise et localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Input id="currency" {...register("currency")} />
            <p className="text-xs text-muted-foreground">Ex: FCFA, EUR, USD</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">Langue / Locale</Label>
            <Input id="locale" {...register("locale")} />
            <p className="text-xs text-muted-foreground">Ex: fr-FR, en-US</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="timezone" className="flex items-center gap-2">
              <Clock className="h-3 w-3" /> Fuseau horaire
            </Label>
            <Input id="timezone" {...register("timezone")} />
            <p className="text-xs text-muted-foreground">Ex: Africa/Bamako</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Regles pedagogiques
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gradingScale">Echelle de notation</Label>
            <Input id="gradingScale" type="number" {...register("gradingScale")} />
            <p className="text-xs text-muted-foreground">Ex: 20 (note maximale)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passMark">Note de passage</Label>
            <Input id="passMark" type="number" {...register("passMark")} />
            <p className="text-xs text-muted-foreground">Ex: 10 (moyenne minimale)</p>
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
