import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye, Pencil, Trash2, Phone, AlertCircle, GraduationCap, Award,
} from "lucide-react";
import {
  DataTable,
  Column,
  StatusBadge,
  BadgeVariant,
} from "@/components/shared";
import { Button, Avatar, AvatarFallback } from "@/components/ui";
import { formatDate, initials, formatCurrency } from "@/lib/formatters";
import type { Student } from "@/types/student";

interface StudentTableProps {
  students: Student[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  selection?: {
    enabled: boolean;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
    onSortChange: (field: string, direction: "asc" | "desc") => void;
  };
  onDelete: (student: Student) => void;
}

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  TRANSFERRED: "info",
  GRADUATED: "purple",
  DROPPED: "danger",
  SUSPENDED: "warning",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  TRANSFERRED: "Transfere",
  GRADUATED: "Diplome",
  DROPPED: "Abandon",
  SUSPENDED: "Suspendu",
};

const ENROLLMENT_VARIANTS: Record<string, BadgeVariant> = {
  NOUVEAU: "success",
  ANCIEN: "info",
  REDOUBLANT: "warning",
};

const ENROLLMENT_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  ANCIEN: "Ancien",
  REDOUBLANT: "Redoublant",
};

const CYCLE_LABELS: Record<string, string> = {
  PREMIER_CYCLE: "1er cycle",
  DEUXIEME_CYCLE: "2e cycle",
  LYCEE: "Lycee",
};

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function StudentTable({
  students,
  isLoading,
  emptyState,
  selection,
  sort,
  onDelete,
}: StudentTableProps) {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("student:update");
  const canDelete = hasPermission("student:delete");
  const canViewFinance = hasPermission("invoice:view");
  const allColumns: Column<Student>[] = [
    {
      key: "photo",
      header: "",
      cell: (student) => (
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials(student.firstName, student.lastName)}
          </AvatarFallback>
        </Avatar>
      ),
      width: "50px",
    },
    {
      key: "matricule",
      header: "Matricule",
      sortable: true,
      cell: (student) => (
        <span className="font-mono text-xs text-muted-foreground">
          {student.matricule}
        </span>
      ),
    },
    {
      key: "lastName",
      header: "Eleve",
      sortable: true,
      cell: (student) => (
        <div className="flex flex-col">
          <Link
            to={`/students/${student.id}`}
            className="text-sm font-medium hover:underline"
          >
            <strong>{student.lastName}</strong> {student.firstName}
          </Link>
          {student.guardians && student.guardians.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" />
              {student.guardians[0].guardian.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "gender",
      header: "Sexe",
      sortable: false,
      cell: (student) => (
        <StatusBadge
          label={student.gender === "M" ? "M" : "F"}
          variant={student.gender === "M" ? "info" : "pink"}
        />
      ),
      width: "70px",
    },
    {
      key: "birthDate",
      header: "Age",
      sortable: true,
      cell: (student) => (
        <div className="flex flex-col">
          <span className="text-sm">{calculateAge(student.birthDate)} ans</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(student.birthDate)}
          </span>
        </div>
      ),
    },
    {
      key: "class",
      header: "Classe",
      cell: (student) => {
        const enrollment = student.enrollments?.[0];
        if (!enrollment?.class) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium w-fit">
              {enrollment.class.name}
            </span>
            {enrollment.level?.cycle && (
              <span className="text-xs text-muted-foreground">
                {CYCLE_LABELS[enrollment.level.cycle] || enrollment.level.cycle}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "enrollmentStatus",
      header: "Nouveaute",
      cell: (student) => {
        const status = student.enrollmentStatus;
        if (!status) return <span className="text-xs text-muted-foreground">—</span>;

        return (
          <StatusBadge
            label={
              status === "ANCIEN" && student.yearsEnrolled
                ? `Ancien (${student.yearsEnrolled} ans)`
                : ENROLLMENT_LABELS[status] || status
            }
            variant={ENROLLMENT_VARIANTS[status] || "gray"}
            icon={
              status === "REDOUBLANT" ? (
                <Award className="h-3 w-3" />
              ) : status === "NOUVEAU" ? (
                <GraduationCap className="h-3 w-3" />
              ) : undefined
            }
          />
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      sortable: false,
      cell: (student) => (
        <StatusBadge
          label={STATUS_LABELS[student.status] || student.status}
          variant={STATUS_VARIANTS[student.status] || "gray"}
        />
      ),
    },
    {
      key: "unpaid",
      header: "Solde",
      cell: (student) => {
        if (!student.unpaidAmount || student.unpaidAmount === 0) {
          return <span className="text-xs text-green-600">A jour</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
            <AlertCircle className="h-3 w-3" />
            {formatCurrency(student.unpaidAmount)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      headerClassName: "text-right",
      cell: (student) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" asChild title="Voir la fiche">
            <Link to={`/students/${student.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {canUpdate && (
            <Button variant="ghost" size="icon" asChild title="Modifier">
              <Link to={`/students/${student.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(student)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
      width: "120px",
    },
  ];

  // Filtrer la colonne Solde si l'utilisateur n'a pas la permission
  const columns = canViewFinance
    ? allColumns
    : allColumns.filter((c) => c.key !== "unpaid");

  return (
    <DataTable
      data={students}
      columns={columns}
      keyExtractor={(s) => s.id}
      isLoading={isLoading}
      emptyState={emptyState}
      selection={selection}
      sort={sort}
    />
  );
}
