import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { api } from "@/lib/axios";
import { toast } from "sonner";

interface Props {
  receiptId: string | null | undefined;
  receiptNumber?: string | null;
  disabled?: boolean;
}

export function ReceiptPDFButton({ receiptId, receiptNumber, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!receiptId) {
      toast.error("Aucun recu associe a ce paiement");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/receipts/${receiptId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `recu-${receiptNumber || receiptId.slice(0, 8)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors du telechargement du recu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={loading || disabled || !receiptId}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Telechargement...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Telecharger le recu PDF
        </>
      )}
    </Button>
  );
}
