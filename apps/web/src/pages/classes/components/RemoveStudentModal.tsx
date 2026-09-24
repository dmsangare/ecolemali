import { useState } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useCancelEnrollment } from "@/hooks/enrollments";

interface RemoveStudentModalProps {
  classId: string;
  studentId: string;
  studentName: string;
  onClose: () => void;
}

interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: string;
}

export function RemoveStudentModal({
  classId,
  studentId,
  studentName,
  onClose,
}: RemoveStudentModalProps) {
  const [reason, setReason] = useState("");
  const cancelMutation = useCancelEnrollment();

  // Chercher l'enrollment correspondant
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["enrollments", "find", classId, studentId],
    queryFn: async () => {
      const { data } = await api.get("/enrollments", {
        params: { classId },
      });
      return (data.data || data) as Enrollment[];
    },
  });

  const enrollment = enrollments?.find(
    (e) => e.studentId === studentId && e.status !== "CANCELLED",
  );

  const handleSubmit = async () => {
    if (!enrollment) return;
    try {
      await cancelMutation.mutateAsync({ id: enrollment.id, reason });
      onClose();
    } catch {
      // erreur geree par le hook
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          {/* HEADER */}
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Retirer l eleve</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cette action retirera l eleve de la classe.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={cancelMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* NOM ELEVE */}
          <div className="bg-muted/50 rounded-md p-3 border">
            <p className="text-xs text-muted-foreground mb-0.5">Eleve</p>
            <p className="font-medium">{studentName}</p>
          </div>

          {/* RAISON */}
          <div>
            <Label htmlFor="reason">Raison (optionnel)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Changement de classe, demenagement..."
              className="mt-1"
            />
          </div>

          {/* INFO */}
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-2">
            💡 L eleve ne sera pas supprime. Vous pourrez le reaffecter a
            une autre classe.
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={cancelMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!enrollment || cancelMutation.isPending || isLoading}
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Retirer l eleve
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
