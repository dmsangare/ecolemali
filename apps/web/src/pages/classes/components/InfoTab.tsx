import { Users, UserCircle2, MapPin, Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useClass, useClassDashboard } from "@/hooks/classes";

export function InfoTab({ classId }: { classId: string }) {
  const { data: cls } = useClass(classId);
  const { data: dashboard } = useClassDashboard(classId);

  const stats = dashboard?.stats || { total: 0, boys: 0, girls: 0, capacity: 0, fillRate: 0 };

  return (
    <div className="space-y-6">
      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eleves" value={stats.total} icon="👥" />
        <StatCard label="Garcons" value={stats.boys} icon="👦" />
        <StatCard label="Filles" value={stats.girls} icon="👧" />
        <StatCard
          label="Remplissage"
          value={`${stats.fillRate}%`}
          icon="📊"
          subtitle={`${stats.total} / ${stats.capacity}`}
        />
      </div>

      {/* DETAILS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nom" value={cls?.name} />
            <Row label="Code" value={cls?.code} mono />
            <Row label="Niveau" value={cls?.level?.name} />
            <Row
              label="Cycle"
              value={
                cls?.level?.cycle === "PREMIER_CYCLE"
                  ? "1er cycle"
                  : "2eme cycle"
              }
            />
            <Row label="Statut" value={cls?.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Organisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="Annee scolaire"
              value={cls?.academicYear?.label}
            />
            <Row
              label="Salle"
              value={cls?.room?.name}
              icon={<MapPin className="h-3.5 w-3.5" />}
            />
            <Row label="Capacite" value={cls?.capacity?.toString()} />
            <Row
              label="Titulaire"
              value={
                cls?.mainTeacher
                  ? `${cls.mainTeacher.firstName} ${cls.mainTeacher.lastName}`
                  : "Non defini"
              }
              icon={<UserCircle2 className="h-3.5 w-3.5" />}
              muted={!cls?.mainTeacher}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
  icon,
  muted,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  icon?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-medium text-right",
          mono && "font-mono",
          muted && "text-muted-foreground italic",
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}

import { cn } from "@/lib/utils";
