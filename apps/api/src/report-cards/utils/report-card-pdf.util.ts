import puppeteer from "puppeteer";

interface ReportCardItem {
  subjectName: string;
  coefficient: number;
  average: number | null;
  weighted: number | null;
  rank: number | null;
}

interface ReportCardPDFData {
  // École
  schoolName: string;
  schoolAddress?: string | null;
  schoolPhone?: string | null;
  schoolMotto?: string | null;
  schoolLogoUrl?: string | null;

  // Élève
  studentName: string;
  studentMatricule: string;
  studentGender: string;
  studentBirthDate: string;
  studentBirthPlace?: string | null;

  // Classe + Période
  className: string;
  classSize: number;
  termName: string;
  academicYear: string;

  // Notes
  items: ReportCardItem[];
  totalCoefficient: number;
  totalWeighted: number;
  generalAverage: number | null;
  rank: number | null;
  absencesCount: number;
  latesCount: number;

  // Décision + Appréciation
  decision: string | null;
  appreciation: string | null;
}

const DECISION_LABELS: Record<string, string> = {
  ADMIS: "Admis en classe supérieure",
  PASSE: "Passe",
  REDOUBLE: "Redouble",
  EXCLU: "Exclu",
  A_DETERMINER: "Décision à déterminer",
};

export async function generateReportCardPDF(
  data: ReportCardPDFData,
): Promise<Buffer> {
  const html = buildHTML(data);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "8mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function getAppreciation(average: number | null): string {
  if (average === null) return "—";
  if (average >= 18) return "Excellent";
  if (average >= 16) return "Très bien";
  if (average >= 14) return "Bien";
  if (average >= 12) return "Assez bien";
  if (average >= 10) return "Passable";
  if (average >= 8) return "Insuffisant";
  return "Très insuffisant";
}

function formatDate(d: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildHTML(data: ReportCardPDFData): string {
  const rowsHTML = data.items
    .map((item) => {
      const moy = item.average !== null ? item.average.toFixed(2) : "—";
      const weighted = item.weighted !== null ? item.weighted.toFixed(2) : "—";
      const rank = item.rank ? `${item.rank}e` : "—";
      const appr = getAppreciation(item.average);
      const color =
        item.average === null
          ? "#9CA3AF"
          : item.average >= 14
            ? "#059669"
            : item.average >= 10
              ? "#2563EB"
              : item.average >= 8
                ? "#EA580C"
                : "#DC2626";

      return `
        <tr>
          <td style="text-align:left;padding-left:6px;">${item.subjectName}</td>
          <td style="text-align:center;font-weight:600;">${item.coefficient}</td>
          <td style="text-align:center;font-weight:600;color:${color};">${moy}</td>
          <td style="text-align:center;">${weighted}</td>
          <td style="text-align:center;">${rank}</td>
          <td style="text-align:center;font-size:9px;color:${color};">${appr}</td>
        </tr>
      `;
    })
    .join("");

  const decisionLabel = data.decision
    ? DECISION_LABELS[data.decision] || data.decision
    : "Décision à déterminer";

  const generalAppr = getAppreciation(data.generalAverage);
  const avgColor =
    data.generalAverage === null
      ? "#1F2937"
      : data.generalAverage >= 14
        ? "#059669"
        : data.generalAverage >= 10
          ? "#2563EB"
          : data.generalAverage >= 8
            ? "#EA580C"
            : "#DC2626";

  const logoHTML = data.schoolLogoUrl
    ? `<img src="${data.schoolLogoUrl}" alt="Logo" style="width:50px;height:50px;object-fit:contain;" />`
    : `<div style="width:50px;height:50px;background:#1E40AF;color:white;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:20px;font-weight:bold;">S</div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #1F2937; line-height: 1.35; }

  .header { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 2.5px double #1E40AF; margin-bottom: 10px; }
  .header-info { flex: 1; }
  .school-name { font-size: 13px; font-weight: bold; color: #1E40AF; text-transform: uppercase; }
  .school-info { font-size: 8px; color: #6B7280; margin-top: 1px; }
  .school-motto { font-size: 8px; font-style: italic; color: #6B7280; margin-top: 1px; }

  .title-block { text-align: center; margin: 10px 0; }
  .title { font-size: 15px; font-weight: bold; color: #1E40AF; letter-spacing: 1px; }
  .subtitle { font-size: 10px; color: #4B5563; margin-top: 2px; font-weight: 600; }

  .student-box {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 4px;
    padding: 8px 12px;
    margin-bottom: 10px;
  }
  .student-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 20px;
    font-size: 10px;
  }
  .student-row { display: flex; gap: 6px; }
  .student-label { color: #6B7280; font-weight: 500; min-width: 70px; }
  .student-value { font-weight: 600; color: #1F2937; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th {
    background: #1E40AF;
    color: white;
    padding: 5px 3px;
    font-size: 8px;
    text-align: center;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border: 1px solid #1E40AF;
  }
  td {
    padding: 4px 3px;
    font-size: 10px;
    border: 1px solid #E5E7EB;
  }
  tr:nth-child(even) td { background: #F9FAFB; }
  tr.total-row td {
    background: #F3F4F6 !important;
    font-weight: bold;
    font-size: 10px;
    border-top: 2px solid #1E40AF;
  }

  .average-box {
    background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
    border: 2px solid #0EA5E9;
    border-radius: 6px;
    padding: 10px 15px;
    margin: 10px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .average-label { font-size: 9px; color: #0369A1; text-transform: uppercase; letter-spacing: 0.5px; }
  .average-value { font-size: 20px; font-weight: bold; color: ${avgColor}; margin-top: 2px; }
  .average-appr { font-size: 11px; font-weight: 600; color: ${avgColor}; }
  .rank-value { font-size: 16px; font-weight: bold; color: #1E40AF; }

  .info-line {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    padding: 5px 10px;
    margin-bottom: 8px;
    display: flex;
    gap: 20px;
    font-size: 9px;
  }
  .info-line-item { display: flex; gap: 4px; }
  .info-line-label { color: #6B7280; }
  .info-line-value { font-weight: 600; }

  .section {
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    padding: 8px 10px;
    margin-bottom: 8px;
  }
  .section-title {
    font-size: 9px;
    font-weight: bold;
    color: #1E40AF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }
  .appreciation-text {
    font-size: 10px;
    line-height: 1.5;
    color: #374151;
    font-style: italic;
    min-height: 25px;
  }
  .decision-text {
    font-size: 12px;
    font-weight: bold;
    color: #1E40AF;
    text-align: center;
    padding: 4px 0;
  }

  .signature-block {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 10px;
  }
  .signature-item { text-align: center; width: 40%; }
  .signature-line { border-top: 1px solid #1F2937; margin-bottom: 3px; padding-top: 15px; }
  .signature-label { font-size: 8px; color: #6B7280; font-style: italic; }

  .footer {
    text-align: center;
    font-size: 7.5px;
    color: #9CA3AF;
    margin-top: 15px;
    padding-top: 6px;
    border-top: 1px solid #E5E7EB;
  }
</style>
</head>
<body>

<div class="header">
  ${logoHTML}
  <div class="header-info">
    <div class="school-name">${data.schoolName}</div>
    ${data.schoolAddress ? `<div class="school-info">${data.schoolAddress}</div>` : ""}
    ${data.schoolPhone ? `<div class="school-info">Tel: ${data.schoolPhone}</div>` : ""}
    ${data.schoolMotto ? `<div class="school-motto">"${data.schoolMotto}"</div>` : ""}
  </div>
</div>

<div class="title-block">
  <div class="title">BULLETIN DE NOTES</div>
  <div class="subtitle">${data.termName} — Année scolaire ${data.academicYear}</div>
</div>

<div class="student-box">
  <div class="student-grid">
    <div class="student-row">
      <span class="student-label">Élève :</span>
      <span class="student-value">${data.studentName}</span>
    </div>
    <div class="student-row">
      <span class="student-label">Classe :</span>
      <span class="student-value">${data.className}</span>
    </div>
    <div class="student-row">
      <span class="student-label">Matricule :</span>
      <span class="student-value" style="font-family:monospace;">${data.studentMatricule}</span>
    </div>
    <div class="student-row">
      <span class="student-label">Effectif :</span>
      <span class="student-value">${data.classSize} élèves</span>
    </div>
    <div class="student-row">
      <span class="student-label">Sexe :</span>
      <span class="student-value">${data.studentGender === "M" ? "Masculin" : "Féminin"}</span>
    </div>
    <div class="student-row">
      <span class="student-label">Né(e) le :</span>
      <span class="student-value">${formatDate(data.studentBirthDate)}${data.studentBirthPlace ? ` à ${data.studentBirthPlace}` : ""}</span>
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:30%;text-align:left;padding-left:8px;">Matière</th>
      <th style="width:10%;">Coef</th>
      <th style="width:14%;">Moyenne</th>
      <th style="width:16%;">Coef × Moy</th>
      <th style="width:10%;">Rang</th>
      <th style="width:20%;">Appréciation</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHTML}
    <tr class="total-row">
      <td style="text-align:left;padding-left:6px;">TOTAL</td>
      <td style="text-align:center;">${data.totalCoefficient}</td>
      <td style="text-align:center;">—</td>
      <td style="text-align:center;">${data.totalWeighted.toFixed(2)}</td>
      <td style="text-align:center;">—</td>
      <td style="text-align:center;">—</td>
    </tr>
  </tbody>
</table>

<div class="average-box">
  <div>
    <div class="average-label">Moyenne générale</div>
    <div class="average-value">${data.generalAverage !== null ? data.generalAverage.toFixed(2) : "—"} / 20</div>
    <div class="average-appr">${generalAppr}</div>
  </div>
  <div style="text-align:right;">
    <div class="average-label">Rang</div>
    <div class="rank-value">${data.rank || "—"}${data.classSize ? ` / ${data.classSize}` : ""}</div>
  </div>
</div>

<div class="info-line">
  <div class="info-line-item">
    <span class="info-line-label">Absences :</span>
    <span class="info-line-value">${data.absencesCount || 0}</span>
  </div>
  <div class="info-line-item">
    <span class="info-line-label">Retards :</span>
    <span class="info-line-value">${data.latesCount || 0}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">💬 Appréciation générale du conseil</div>
  <div class="appreciation-text">
    ${data.appreciation || "<em style='color:#9CA3AF;'>Aucune appréciation saisie</em>"}
  </div>
</div>

<div class="section" style="border-color:#0EA5E9;background:#F0F9FF;">
  <div class="section-title" style="color:#0369A1;">🎯 Décision du conseil de classe</div>
  <div class="decision-text">${decisionLabel}</div>
</div>

<div class="signature-block">
  <div class="signature-item">
    <div class="signature-line"></div>
    <div class="signature-label">Le Titulaire de classe</div>
  </div>
  <div class="signature-item">
    <div class="signature-line"></div>
    <div class="signature-label">Le Directeur</div>
  </div>
</div>

<div class="footer">
  Document généré automatiquement par SIS-MALI le ${formatDate(new Date().toISOString())} — Toute reproduction non autorisée est interdite.
</div>

</body>
</html>`;
}
