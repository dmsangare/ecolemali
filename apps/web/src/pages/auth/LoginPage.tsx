import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts";
import { Button, Input } from "@/components/ui";
import {
  User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck,
  Users, FileText, Calendar, Wallet, BarChart3, Code, Phone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Assure-toi que ton AuthContext expose bien 'login'

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Remplacer par l'appel réel à ton AuthContext / API
      await login({ identifier: email, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* COLONNE GAUCHE - IMAGE (Masquée sur mobile) */}
        <div className="hidden lg:flex lg:w-[35%] relative bg-blue-900">
          <img
            src="/login-left.webp"
            alt="École SIS-MALI"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          {/* Voile sombre pour s'assurer que le texte (s'il y en a) soit lisible, mais ici l'image gère le texte */}
          <div className="absolute inset-0 bg-blue-900/10" />
        </div>

        {/* COLONNE CENTRE - FORMULAIRE */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 z-10 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
          <div className="w-full max-w-md space-y-8">
            
            {/* Logo & Titre */}
            <div className="text-center space-y-4">
              <img
                src="/login-logo.webp"
                alt="SIS-MALI"
                className="h-20 mx-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Connexion à votre espace
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Veuillez vous connecter pour accéder à votre compte
                </p>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Email ou téléphone
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sis-mali.local"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Actions (Se souvenir + Mot de passe oublié) */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Se souvenir de moi
                </label>
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
              >
                {isLoading ? (
                  "Connexion en cours..."
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            {/* Footer sécurité */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Accès sécurisé • Données protégées • Utilisation en intranet
            </div>
          </div>
        </div>

        {/* COLONNE DROITE - IMAGE (Masquée sur mobile) */}
        <div className="hidden lg:flex lg:w-[35%] relative bg-blue-50">
          <img
            src="/login-right.webp"
            alt="Bienvenue sur SIS-MALI"
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
        </div>
      </div>

      {/* FOOTER GLOBAL */}
      <footer className="bg-[#0B4E9B] text-white py-3 px-6 flex flex-col sm:flex-row items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <img src="/login-logo.webp" alt="Logo" className="h-5 brightness-0 invert" />
          <span className="font-semibold">SIS-MALI</span>
          <span className="text-blue-200">|</span>
          <span className="text-blue-100">Système d'Information Scolaire pour le Mali</span>
        </div>
        <div className="flex gap-4 mt-2 sm:mt-0 text-blue-100">
          <span>Écoles</span>
          <span>•</span>
          <span>Élèves</span>
          <span>•</span>
          <span>Enseignants</span>
          <span>•</span>
          <span>Parents</span>
          <span>•</span>
          <span>Administration</span>
        </div>
      </footer>
    </div>
  );
}
