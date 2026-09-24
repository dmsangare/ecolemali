import * as XLSX from "xlsx";
import { api } from "@/lib/axios";

// ============================================================
// CSV
// ============================================================
export function exportCSV(rows: any[], filename: string) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h];
        if (v === null || v === undefined) return '""';
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(";")
    ),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
}

// ============================================================
// EXCEL (.xlsx)
// ============================================================
export function exportExcel(
  sheets: Array<{ name: string; rows: any[] }>,
  filename: string
) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    if (!sheet.rows || sheet.rows.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([["Aucune donnée"]]);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
      continue;
    }
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    // Auto-width
    const colWidths = Object.keys(sheet.rows[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...sheet.rows.map((r) => String(r[key] ?? "").length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ============================================================
// PDF (via backend)
// ============================================================
export async function exportPDF(endpoint: string, filename: string) {
  const res = await api.get(endpoint, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  downloadBlob(blob, `${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ============================================================
// Helper
// ============================================================
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
