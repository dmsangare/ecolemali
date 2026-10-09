import { useState } from "react";
import { X, Loader2, Download, CreditCard, Info } from "lucide-react";
import { Button, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { studentsApi } from "@/api/students";
import { toast } from "sonner";

interface GenerateIdCardsModalProps {
  payload: { classId?: string; studentIds?: string[] };
  label: string;
  onClose: () => void;
}

export function GenerateIdCardsModal({
  payload,
  label,
  onClose,
}: GenerateIdCardsModalProps) {
  const [format, setFormat] = useState<"A4" | "PVC">("A4");
  const [includeVerso, setIncludeVerso] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const blob = await studentsApi.generateIdCards({
        classId: payload.classId,
        studentIds: payload.studentIds,
        format,
        includeVerso,
      });

      // Telecharger
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cartes-${format.toLowerCase()}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Cartes generees avec succes");
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de la generation";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Generer les cartes scolaires
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isGenerating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* CORPS */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* INFO */}
          <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/50 p-3">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Chaque carte porte un <strong>QR code unique signe</strong>. Le PDF
              sera telecharge automatiquement.
            </p>
          </div>

          {/* FORMAT */}
          <div className="space-y-3">
            <Label>Format du PDF</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("A4")}
                disabled={isGenerating}
                className={cn(
                  "rounded-lg border-2 p-4 text-center transition-colors",
                  format === "A4"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-muted-foreground/50",
                )}
              >
                <p className="font-semibold">A4 (maison)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  8 cartes par page - format PVC standard
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFormat("PVC")}
                disabled={isGenerating}
                className={cn(
                  "rounded-lg border-2 p-4 text-center transition-colors",
                  format === "PVC"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-muted-foreground/50",
                )}
              >
                <p className="font-semibold">PVC (imprimeur)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pour impression professionnelle
                </p>
              </button>
            </div>
          </div>

          {/* VERSO */}
          <div className="flex items-start gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              id="verso"
              checked={includeVerso}
              onChange={(e) => setIncludeVerso(e.target.checked)}
              disabled={isGenerating}
              className="h-4 w-4 mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="verso" className="cursor-pointer">
                Ajouter le verso (reglement + contacts)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Le dos de chaque carte contiendra le reglement interieur et les
                contacts d'urgence de l'ecole.
              </p>
            </div>
          </div>

          {/* APERCU (generique) */}
          <div className="rounded-md border p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-3 text-center">
              Apercu (carte generique)
            </p>
            <div className="mx-auto w-64 h-40 rounded border-2 border-primary overflow-hidden bg-white shadow-sm">
              <div className="bg-primary text-white px-3 py-1.5 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white text-primary font-bold text-xs flex items-center justify-center">
                  SIS
                </div>
                <div className="text-xs font-semibold truncate">
                  Ecole Privee
                </div>
              </div>
              <div className="p-2 flex gap-2">
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  Photo
                </div>
                <div className="flex-1 text-[10px] space-y-0.5">
                  <div className="font-bold text-xs">DIALLO</div>
                  <div>Amadou</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matricule</span>
                    <strong>XXXX</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classe</span>
                    <strong>6eme A</strong>
                  </div>
                </div>
                <div className="w-12 h-12 border border-primary rounded flex items-center justify-center text-[8px] text-primary">
                  QR
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? "Generation..." : "Generer le PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
