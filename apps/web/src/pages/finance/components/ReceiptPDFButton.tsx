import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { api } from "@/lib/axios";
import { toast } from "sonner";

interface Props {
  paymentId: string;
  disabled?: boolean;
}

export function ReceiptPDFButton({ paymentId, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `recu-${paymentId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Erreur lors du téléchargement du reçu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={loading || disabled}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Télécharger le reçu PDF
    </Button>
  );
}
