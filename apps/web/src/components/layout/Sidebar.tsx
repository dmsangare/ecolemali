import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Award,
  TrendingUp,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  School,
  UsersRound,
  Library,
  UserCog,
  Tag,
  Coins,
  TrendingDown, AlertTriangle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/hooks/school/useSchool";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Tableau de bord", to: "/dashboard", icon: LayoutDashboard },
      { label: "Tableau d'honneur", to: "/honor-roll", icon: Trophy },
    ],
  },
  {
    title: "Scolarite",
    items: [
      { label: "Eleves", to: "/students", icon: Users, permission: "student:view" },
      { label: "Classes", to: "/classes", icon: School, permission: "class:view" },
      { label: "Enseignants", to: "/teachers", icon: UsersRound, permission: "teacher:view" },
      { label: "Matieres", to: "/subjects", icon: BookOpen, permission: "subject:view" },
    ],
  },
  {
    title: "Pedagogie",
    items: [
      { label: "Emploi du temps", to: "/timetable", icon: Calendar, permission: "timetable:view" },
      { label: "Presences", to: "/attendance", icon: ClipboardCheck, permission: "attendance:view" },
      { label: "Notes", to: "/assessments", icon: FileText, permission: "grade:view" },
      { label: "Bulletins", to: "/report-cards", icon: Award, permission: "report_card:view" },
      { label: "Resultats annuels", to: "/annual-results", icon: TrendingUp, permission: "report_card:view" },
    ],
  },
  {
    title: "Examens",
    items: [
      { label: "Examens", to: "/exams", icon: GraduationCap, permission: "exam:view" },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "Types de frais", to: "/fee-types", icon: Tag, permission: "fee:view" },
      { label: "Grille tarifaire", to: "/fee-structures", icon: Coins, permission: "fee:view" },
      { label: "Factures", to: "/invoices", icon: Receipt, permission: "invoice:view" },
      { label: "Depenses", to: "/expenses", icon: TrendingDown, permission: "expense:view" },
      { label: "Relances", to: "/reminders", icon: AlertTriangle, permission: "invoice:view" },
      { label: "Paiements", to: "/payments", icon: Wallet, permission: "payment:view" },
      { label: "Caisse", to: "/cash-sessions", icon: Wallet, permission: "cash:view" },
    ],
  },
    {
      title: "Services",
      items: [
        { label: "Cartes scolaires", to: "/id-cards", icon: CreditCard, permission: "student:view" },
      ],
    },
    {
    title: "Systeme",
    items: [
      { label: "Rapports", to: "/reports", icon: BarChart3, permission: "report:view" },
      { label: "Parametres", to: "/settings", icon: Settings, permission: "settings:view" },
    ],
  },
];

export function Sidebar() {
  const { hasPermission } = useAuth();
  const { data: school } = useSchool();

  const hasLogo = !!school?.logoUrl;
  const schoolName = school?.name || "SIS-MALI";
  const sigle = school?.sigle || "S";

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        {hasLogo ? (
          <img
            src={school!.logoUrl!}
            alt={schoolName}
            className="h-8 w-8 rounded-md object-contain shrink-0"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold shrink-0">
            {sigle.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold leading-none truncate" title={schoolName}>
            {schoolName}
          </span>
          <span className="text-xs text-muted-foreground leading-none mt-0.5">
            Gestion scolaire
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <p className="text-xs text-muted-foreground text-center">
          SIS-MALI v1.0
        </p>
      </div>
    </aside>
  );
}
