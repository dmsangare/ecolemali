import { Download, FileSpreadsheet, FileText, FileType } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from "@/components/ui";

interface ExportButtonProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  disabled?: boolean;
  label?: string;
}

export function ExportButton({
  onExportExcel,
  onExportPDF,
  onExportCSV,
  disabled,
  label = "Exporter",
}: ExportButtonProps) {
  const hasAny = onExportExcel || onExportPDF || onExportCSV;

  if (!hasAny) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Format d export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onExportExcel && (
          <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
            Excel (.xlsx)
          </DropdownMenuItem>
        )}
        {onExportCSV && (
          <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
            <FileType className="h-4 w-4 mr-2 text-blue-600" />
            CSV (.csv)
          </DropdownMenuItem>
        )}
        {onExportPDF && (
          <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2 text-red-600" />
            PDF (.pdf)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
