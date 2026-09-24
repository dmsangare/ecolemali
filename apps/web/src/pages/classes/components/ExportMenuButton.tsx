import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, FileType, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";

interface ExportMenuButtonProps {
  classId: string;
  className?: string;
}

export function ExportMenuButton({ classId, className }: ExportMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer au clic exterieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const downloadFile = async (type: "csv" | "excel" | "pdf") => {
    setLoading(type);
    try {
      const response = await api.get(`/students/export/${type}`, {
        params: { classId },
        responseType: "blob",
      });

      // Creer un lien de telechargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Nom de fichier
      const ext = type === "excel" ? "xlsx" : type;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `classe-eleves-${date}.${ext}`);

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
      key: "csv" as const,
      label: "CSV",
      description: "Fichier texte (Excel, Sheets)",
      icon: FileText,
    },
    {
      key: "excel" as const,
      label: "Excel",
      description: "Feuille de calcul .xlsx",
      icon: FileSpreadsheet,
    },
    {
      key: "pdf" as const,
      label: "PDF",
      description: "Document imprimable",
      icon: FileType,
    },
  ];

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={loading !== null}
      >
        <Download className="h-4 w-4 mr-2" />
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
                <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
                {loading === item.key && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    ...
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
