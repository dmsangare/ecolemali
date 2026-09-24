import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { reportCardsApi } from "@/api/report-cards";

interface Props {
  reportCardId: string;
  studentName: string;
}

export function ExportReportCardButton({ reportCardId, studentName }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await reportCardsApi.exportPDF(reportCardId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = studentName
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .slice(0, 40);
      link.setAttribute("download", `bulletin-${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur export PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Exporter PDF
    </Button>
  );
}
