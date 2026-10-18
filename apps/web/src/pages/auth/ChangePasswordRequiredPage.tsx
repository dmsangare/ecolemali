import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChangePasswordRequiredPage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // Regles de validation
  const rules = {
    length: newPassword.length >= 12,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const allValid =
    currentPassword.length > 0 &&
    rules.length &&
    rules.upper &&
    rules.lower &&
    rules.digit &&
    rules.special &&
    rules.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success("Mot de passe modifié avec succes");
      // Rafraichir le user pour recuperer mustChangePassword = false
      await refreshUser();
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erreur lors du changement";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardContent className="p-8 space-y-6">
          {/* HEADER */}
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Changement de mot de passe requis</h1>
            <p className="text-sm text-muted-foreground">
              Pour des raisons de securite, vous devez changer votre mot de passe
              avant de continuer.
            </p>
            {user && (
              <p className="text-xs text-muted-foreground">
                Connecte en tant que <strong>{user.email || user.phone}</strong>
              </p>
            )}
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mot de passe actuel */}
            <div className="space-y-2">
              <Label htmlFor="current">Mot de passe actuel *</Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="new">Nouveau mot de passe *</Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 12 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le nouveau mot de passe *</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                required
              />
            </div>

            {/* Regles */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Le mot de passe doit contenir :
              </p>
              {[
                { key: "length", label: "Au moins 12 caracteres" },
                { key: "upper", label: "Une majuscule" },
                { key: "lower", label: "Une minuscule" },
                { key: "digit", label: "Un chiffre" },
                { key: "special", label: "Un caractere special (!@#$...)" },
                { key: "match", label: "Les deux mots de passe correspondent" },
              ].map((rule) => {
                const ok = rules[rule.key as keyof typeof rules];
                return (
                  <div
                    key={rule.key}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      ok ? "text-green-600" : "text-muted-foreground",
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "h-3.5 w-3.5",
                        ok ? "text-green-600" : "text-muted-foreground/40",
                      )}
                    />
                    {rule.label}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="submit"
                disabled={!allValid || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
              >
                Se deconnecter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
