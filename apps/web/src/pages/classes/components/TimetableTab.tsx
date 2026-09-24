import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

export function TimetableTab({ classId: _classId }: { classId: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <Calendar className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-medium">Emploi du temps</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md text-center">
          L emploi du temps sera disponible apres la refonte du module
          Emploi du temps (prochaine phase).
        </p>
      </CardContent>
    </Card>
  );
}
