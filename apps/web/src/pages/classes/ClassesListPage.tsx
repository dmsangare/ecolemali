import { Link } from "react-router-dom";
import { School, Plus, Users, Loader2, Eye } from "lucide-react";
import { useClasses } from "@/hooks/classes";
import {
  Button,
  Card,
  CardContent,
} from "@/components/ui";

export function ClassesListPage() {
  const { data: classes, isLoading } = useClasses();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <School className="h-6 w-6" />
            Classes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {classes?.length || 0} classe(s)
          </p>
        </div>
        <Button asChild>
          <Link to="/classes/new">
            <Plus className="h-4 w-4" />
            Nouvelle classe
          </Link>
        </Button>
      </div>

      {!classes || classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col h-64 items-center justify-center gap-3">
            <School className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucune classe</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/classes/new">
                <Plus className="h-4 w-4" />
                Creer la premiere classe
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/classes/${cls.id}`}
                      className="text-lg font-bold hover:underline"
                    >
                      {cls.name}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {cls.code}
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {cls.level?.name || "—"}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{cls._count?.enrollments || 0} eleve(s)</span>
                  </div>
                  {cls.room && (
                    <p className="text-sm text-muted-foreground">
                      Salle : {cls.room.name}
                    </p>
                  )}
                  {cls.mainTeacher && (
                    <p className="text-sm text-muted-foreground">
                      Prof. principal : {cls.mainTeacher.firstName}{" "}
                      {cls.mainTeacher.lastName}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/classes/${cls.id}`}>
                      <Eye className="h-4 w-4" />
                      Voir details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
