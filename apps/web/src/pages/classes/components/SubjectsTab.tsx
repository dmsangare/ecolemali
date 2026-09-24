import { BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

interface Subject {
  id: string;
  code: string;
  name: string;
  type?: string;
}

export function SubjectsTab({
  classId: _classId,
  levelId: _levelId,
}: {
  classId: string;
  levelId: string;
}) {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects", "list"],
    queryFn: async () => {
      const { data } = await api.get("/subjects");
      return (data.data || data) as Subject[];
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium">Aucune matiere configuree</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez les matieres dans le module Matieres
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Matiere</th>
                <th className="text-left p-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{s.code}</td>
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {s.type === "CORE" ? "Fondamentale" : s.type || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
