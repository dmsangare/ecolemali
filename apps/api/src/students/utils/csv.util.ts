/**
 * Utilitaire de generation CSV pour l'export.
 */

export function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Si contient ; " \n ou \r → entourer de guillemets et doubler les guillemets
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(headers: string[], rows: any[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCSV).join(";"));
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(";"));
  }
  // BOM UTF-8 pour qu'Excel ouvre correctement les accents
  return "\uFEFF" + lines.join("\r\n");
}
