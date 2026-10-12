import ExcelJS from "exceljs";
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
// EXCEL (.xlsx) - via exceljs
// ============================================================
export async function exportExcel(
  sheets: Array<{ name: string; rows: any[] }>,
  filename: string
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIS-MALI";
  wb.created = new Date();

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31));

    if (!sheet.rows || sheet.rows.length === 0) {
      ws.addRow(["Aucune donnée"]);
      continue;
    }

    // Headers = cles du premier objet
    const headers = Object.keys(sheet.rows[0]);
    ws.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: Math.min(
        Math.max(
          h.length,
          ...sheet.rows.map((r) => String(r[h] ?? "").length)
        ) + 2,
        40
      ),
    }));

    // Style des headers
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };

    // Donnees
    for (const row of sheet.rows) {
      ws.addRow(row);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
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
