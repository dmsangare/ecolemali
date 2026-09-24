import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, User, School, ShieldCheck } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/axios";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { CreditsBox } from "@/components/shared";

const LoginSchema = z.object({
  identifier: z.string().min(3, "Email ou telephone requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
});

type LoginForm = z.infer<typeof LoginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success("Connexion reussie");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Colonne gauche : Formulaire de connexion */}
      <div className="flex flex-1 items-center justify-center p-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo + titre */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-3xl shadow-lg">
              S
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">SIS-MALI</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Systeme d Information Scolaire pour le Mali
              </p>
            </div>
          </div>

          {/* Carte login */}
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Connexion
              </CardTitle>
              <CardDescription>
                Accedez a votre espace de gestion scolaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email ou telephone</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="admin@aiglons.ml"
                      className="pl-9"
                      autoComplete="username"
                      autoFocus
                      {...register("identifier")}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-xs text-destructive">
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      autoComplete="current-password"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <School className="h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              {/* Comptes de demonstration */}
              <div className="mt-6 rounded-lg bg-muted p-3 text-xs space-y-1">
                <p className="font-semibold text-foreground mb-2">
                  💡 Comptes de demonstration :
                </p>
                <p className="font-mono">admin@aiglons.ml / Admin@2026!</p>
                <p className="text-muted-foreground text-[10px] mt-1">
                  Apres connexion, changez le mot de passe dans Parametres.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version */}
          <p className="text-center text-xs text-muted-foreground">
            SIS-MALI v1.0 • Developpement local
          </p>
        </div>
      </div>

      {/* Colonne droite : Credits (desktop uniquement) */}
      <div className="hidden lg:flex lg:w-96 xl:w-[420px] flex-col justify-center items-center p-8 bg-muted/20 border-l">
        <div className="w-full max-w-sm space-y-6">
          {/* Presentation rapide */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <School className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Bienvenue sur SIS-MALI</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La solution complete de gestion scolaire pour les ecoles
              fondamentales et lycees du Mali.
            </p>
          </div>

          {/* Fonctionnalites cles */}
          <div className="space-y-2">
            {[
              "Gestion des eleves et inscriptions",
              "Notes, bulletins et conseils de classe",
              "Emploi du temps et presences",
              "Facturation, paiements et caisse",
              "Rapports et statistiques",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <div className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Credits */}
          <CreditsBox />
        </div>
      </div>

      {/* Credits (mobile en bas) */}
      <div className="lg:hidden border-t bg-muted/20">
        <div className="p-4 max-w-md mx-auto">
          <CreditsBox variant="compact" />
        </div>
      </div>
    </div>
  );
}
