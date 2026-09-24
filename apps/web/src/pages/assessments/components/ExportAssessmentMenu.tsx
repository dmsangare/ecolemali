import { useState, useRef, useEffect } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileType,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";

interface ExportAssessmentMenuProps {
  assessmentId: string;
  assessmentTitle: string;
  disabled?: boolean;
}

export function ExportAssessmentMenu({
  assessmentId,
  assessmentTitle,
  disabled,
}: ExportAssessmentMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const downloadFile = async (type: "pdf" | "excel" | "csv") => {
    setLoading(type);
    try {
      const response = await api.get(
        `/assessments/${assessmentId}/export/${type}`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const ext = type === "excel" ? "xlsx" : type;
      const safeTitle = assessmentTitle
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .slice(0, 40);
      link.setAttribute("download", `notes-${safeTitle}.${ext}`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setOpen(false);
    } catch (err) {
      console.error("Erreur export:", err);
    } finally {
      setLoading(null);
    }
  };

  const items = [
    {
      key: "pdf" as const,
      label: "PDF",
      description: "Fiche de notes officielle",
      icon: FileType,
      color: "text-red-500",
    },
    {
      key: "excel" as const,
      label: "Excel",
      description: "Feuille de calcul .xlsx",
      icon: FileSpreadsheet,
      color: "text-green-600",
    },
    {
      key: "csv" as const,
      label: "CSV",
      description: "Fichier texte universel",
      icon: FileText,
      color: "text-blue-500",
    },
  ];

  return (
    <div className={cn("relative", "inline-block")} ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={disabled || loading !== null}
      >
        {loading !== null ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Exporter
        <ChevronDown className="h-3.5 w-3.5 ml-1" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-64 bg-background border rounded-lg shadow-lg overflow-hidden">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => downloadFile(item.key)}
                disabled={loading !== null}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 flex items-start gap-3 transition-colors disabled:opacity-50"
              >
                <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", item.color)} />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
