import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { invoicesApi } from "@/api/invoices";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  studentId: string;
  academicYearId: string;
  studentName: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  label?: string;
}

export function GenerateInvoiceButton({
  studentId,
  academicYearId,
  studentName,
  className,
  variant = "default",
  size = "sm",
  label = "Générer facture",
}: Props) {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleGenerate = async () => {
    if (
      !window.confirm(
        `Générer une facture pour ${studentName} ?\n\nLes frais de la grille tarifaire seront automatiquement ajoutés.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await invoicesApi.autoInvoice(studentId, academicYearId);
      toast.success(`Facture créée : ${(result as any).number || ""}`);
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erreur lors de la génération";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGenerate}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
