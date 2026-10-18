import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, UserPlus, Wallet, FileText, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.roles?.[0] || "";

  // Actions par rôle
  const actionsByRole: Record<string, Action[]> = {
    SECRETARY: [
      { label: "Inscrire un élève", icon: <UserPlus className="h-4 w-4" />, onClick: () => navigate("/students/new") },
      { label: "Rechercher un élève", icon: <FileText className="h-4 w-4" />, onClick: () => navigate("/students") },
    ],
    ACCOUNTANT: [
      { label: "Encaisser", icon: <Wallet className="h-4 w-4" />, onClick: () => navigate("/finance/point-de-caisse") },
    ],
    TEACHER: [
      { label: "Saisir les notes", icon: <ClipboardCheck className="h-4 w-4" />, onClick: () => navigate("/assessments") },
    ],
    DIRECTOR: [
      { label: "Encaisser", icon: <Wallet className="h-4 w-4" />, onClick: () => navigate("/finance/point-de-caisse") },
      { label: "Nouvel élève", icon: <UserPlus className="h-4 w-4" />, onClick: () => navigate("/students/new") },
    ],
    SUPER_ADMIN: [
      { label: "Encaisser", icon: <Wallet className="h-4 w-4" />, onClick: () => navigate("/finance/point-de-caisse") },
      { label: "Nouvel élève", icon: <UserPlus className="h-4 w-4" />, onClick: () => navigate("/students/new") },
    ],
  };

  const actions = actionsByRole[role] || actionsByRole.DIRECTOR;

  if (actions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Actions (apparaissent si open) */}
      {open && (
        <div className="flex flex-col items-end gap-2 mb-2">
          {actions.map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in-0"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-sm font-medium bg-background border rounded-md px-3 py-1.5 shadow-md whitespace-nowrap">
                {action.label}
              </span>
              <Button
                size="icon"
                className={cn("h-12 w-12 rounded-full shadow-lg", action.color)}
                onClick={() => { action.onClick(); setOpen(false); }}
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton principal */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-xl transition-transform duration-200",
          open && "rotate-45"
        )}
        onClick={() => setOpen(!open)}
        title="Actions rapides"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
