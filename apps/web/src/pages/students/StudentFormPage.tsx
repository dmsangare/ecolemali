import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateStudent } from "@/hooks/students";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const StudentSchema = z.object({
  firstName: z.string().min(2, "Le prenom est requis (min. 2 caracteres)"),
  lastName: z.string().min(2, "Le nom est requis (min. 2 caracteres)"),
  gender: z.enum(["M", "F"], { required_error: "Le sexe est requis" }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format AAAA-MM-JJ requis"),
  birthPlace: z.string().optional(),
  nationality: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialSituation: z.string().optional(),
});

type StudentForm = z.infer<typeof StudentSchema>;

export function StudentFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createMutation = useCreateStudent();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentForm>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      gender: "M",
      nationality: "Malienne",
    },
  });

  const onSubmit = async (data: StudentForm) => {
    if (!user?.schoolId) return;
    await createMutation.mutateAsync({
      ...data,
      schoolId: user.schoolId,
    });
    navigate("/students");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* En-tete */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvel eleve</h1>
          <p className="text-sm text-muted-foreground">
            Le matricule sera genere automatiquement
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identite */}
        <Card>
          <CardHeader>
            <CardTitle>Identite de l eleve</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Prenom *</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Sexe *</Label>
              <select
                id="gender"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                {...register("gender")}
              >
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
              </select>
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance *</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
              {errors.birthDate && (
                <p className="text-xs text-destructive">{errors.birthDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthPlace">Lieu de naissance</Label>
              <Input id="birthPlace" placeholder="Bamako" {...register("birthPlace")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationalite</Label>
              <Input id="nationality" {...register("nationality")} />
            </div>
          </CardContent>
        </Card>

        {/* Coordonnees */}
        <Card>
          <CardHeader>
            <CardTitle>Coordonnees</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input id="phone" placeholder="+223 XX XX XX XX" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" placeholder="Hamdallaye ACI 2000..." {...register("address")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="specialSituation">Situation particuliere</Label>
              <Input
                id="specialSituation"
                placeholder="(handicap, allergie, etc.)"
                {...register("specialSituation")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/students">Annuler</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
