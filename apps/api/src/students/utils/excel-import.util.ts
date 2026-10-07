import * as ExcelJS from "exceljs";

// ============================================================
// TYPES
// ============================================================

export interface ParsedRow {
  lineNumber: number;
  data: ParsedStudent | null;
  errors: string[];
}

export interface ParsedStudent {
  lastName: string;
  firstName: string;
  birthDate: Date | null;
  gender: "M" | "F" | null;
  studentStatus: "ANCIEN" | "NOUVEAU";
  fatherLastName: string | null;
  fatherFirstName: string | null;
  fatherPhone: string | null;
  motherLastName: string | null;
  motherFirstName: string | null;
  motherPhone: string | null;
  guardianLastName: string | null;
  guardianFirstName: string | null;
  guardianPhone: string | null;
  className: string;
  birthPlace: string | null;
  matricule: string | null;
  address: string | null;
  enrollmentStatus: "INSCRIT" | "EN_ATTENTE";
}

// ============================================================
// EN-TETES ATTENDUS (insensibles a la casse et aux espaces)
// ============================================================

const HEADER_MAP: Record<string, keyof ParsedStudent | "raw"> = {
  "nom": "lastName",
  "nom eleve": "lastName",
  "prenom": "firstName",
  "prenom eleve": "firstName",
  "date naissance": "birthDate",
  "date de naissance": "birthDate",
  "sexe": "gender",
  "ancien nouveau": "studentStatus",
  "ancien/nouveau": "studentStatus",
  "statut eleve": "studentStatus",
  "nom pere": "fatherLastName",
  "nom du pere": "fatherLastName",
  "prenom pere": "fatherFirstName",
  "prenom du pere": "fatherFirstName",
  "whatsapp pere": "fatherPhone",
  "tel pere": "fatherPhone",
  "telephone pere": "fatherPhone",
  "nom mere": "motherLastName",
  "nom de la mere": "motherLastName",
  "prenom mere": "motherFirstName",
  "prenom de la mere": "motherFirstName",
  "whatsapp mere": "motherPhone",
  "tel mere": "motherPhone",
  "telephone mere": "motherPhone",
  "nom tuteur": "guardianLastName",
  "prenom tuteur": "guardianFirstName",
  "whatsapp tuteur": "guardianPhone",
  "tel tuteur": "guardianPhone",
  "telephone tuteur": "guardianPhone",
  "classe": "className",
  "lieu naissance": "birthPlace",
  "lieu de naissance": "birthPlace",
  "matricule": "matricule",
  "adresse": "address",
  "statut": "enrollmentStatus",
};

// ============================================================
// NORMALISATION
// ============================================================

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlever accents
    .replace(/[^a-z0-9/\s]/g, "")
    .replace(/\s+/g, " ");
}

function normalizePhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const cleaned = String(p).replace(/[^\d]/g, "");
  if (cleaned.length < 8) return null;
  // Enlever indicatif 223 si present
  if (cleaned.startsWith("223") && cleaned.length > 8) {
    return cleaned.slice(3);
  }
  return cleaned;
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // Excel serial date
    return new Date((val - 25569) * 86400 * 1000);
  }
  const str = String(val).trim();
  // Format JJ/MM/AAAA
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  }
  // Format ISO
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function parseGender(val: any): "M" | "F" | null {
  if (!val) return null;
  const s = String(val).trim().toUpperCase();
  if (s === "M" || s === "MASCULIN" || s === "GARCON" || s === "G") return "M";
  if (s === "F" || s === "FEMININ" || s === "FILLE") return "F";
  return null;
}

function parseStudentStatus(val: any): "ANCIEN" | "NOUVEAU" {
  if (!val) return "NOUVEAU";
  const s = String(val).trim().toUpperCase();
  return s === "ANCIEN" ? "ANCIEN" : "NOUVEAU";
}

function parseEnrollmentStatus(val: any): "INSCRIT" | "EN_ATTENTE" {
  if (!val) return "INSCRIT";
  const s = String(val).trim().toUpperCase();
  return s.includes("ATTENTE") ? "EN_ATTENTE" : "INSCRIT";
}

// ============================================================
// PARSE D'UN FICHIER EXCEL
// ============================================================

export async function parseStudentsExcel(
  buffer: Buffer,
): Promise<{ rows: ParsedRow[]; classesTrouvees: Set<string> }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("Fichier Excel vide");
  }

  // Trouver la ligne d'en-tete (chercher "Nom" et "Prenom" dans les 10 premieres lignes)
  let headerRowNumber = -1;
  let headerMapping: Record<number, keyof ParsedStudent> = {};

  for (let i = 1; i <= Math.min(10, sheet.rowCount); i++) {
    const row = sheet.getRow(i);
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(String(cell.value || ""));
    });

    // Chercher si cette ligne contient les en-tetes
    const mapping: Record<number, keyof ParsedStudent> = {};
    let hasNom = false;
    let hasPrenom = false;

    cells.forEach((h, idx) => {
      const norm = normalizeHeader(h);
      const field = HEADER_MAP[norm];
      if (field && field !== "raw") {
        mapping[idx + 1] = field;
        if (field === "lastName") hasNom = true;
        if (field === "firstName") hasPrenom = true;
      }
    });

    if (hasNom && hasPrenom) {
      headerRowNumber = i;
      headerMapping = mapping;
      break;
    }
  }

  if (headerRowNumber === -1) {
    throw new Error(
      "En-tetes introuvables. Le fichier doit contenir au moins les colonnes 'Nom' et 'Prenom'.",
    );
  }

  const rows: ParsedRow[] = [];
  const classesTrouvees = new Set<string>();

  // Parcourir les donnees a partir de headerRowNumber + 1
  for (let i = headerRowNumber + 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    // Sauter les lignes vides
    const isEmpty = row.values === undefined || row.values === null;
    if (isEmpty) continue;

    const data: any = {};
    Object.entries(headerMapping).forEach(([colIdx, field]) => {
      const val = row.getCell(parseInt(colIdx)).value;
      if (val !== null && val !== undefined && val !== "") {
        data[field] = val;
      }
    });

    // Verifier si la ligne est entierement vide
    const hasData = Object.keys(data).length > 0;
    if (!hasData) continue;

    const errors: string[] = [];

    // Construire l'objet
    const student: ParsedStudent = {
      lastName: String(data.lastName || "").trim(),
      firstName: String(data.firstName || "").trim(),
      birthDate: parseDate(data.birthDate),
      gender: parseGender(data.gender),
      studentStatus: parseStudentStatus(data.studentStatus),
      fatherLastName: data.fatherLastName ? String(data.fatherLastName).trim() : null,
      fatherFirstName: data.fatherFirstName ? String(data.fatherFirstName).trim() : null,
      fatherPhone: normalizePhone(data.fatherPhone),
      motherLastName: data.motherLastName ? String(data.motherLastName).trim() : null,
      motherFirstName: data.motherFirstName ? String(data.motherFirstName).trim() : null,
      motherPhone: normalizePhone(data.motherPhone),
      guardianLastName: data.guardianLastName ? String(data.guardianLastName).trim() : null,
      guardianFirstName: data.guardianFirstName ? String(data.guardianFirstName).trim() : null,
      guardianPhone: normalizePhone(data.guardianPhone),
      className: String(data.className || "").trim(),
      birthPlace: data.birthPlace ? String(data.birthPlace).trim() : null,
      matricule: data.matricule ? String(data.matricule).trim() : null,
      address: data.address ? String(data.address).trim() : null,
      enrollmentStatus: parseEnrollmentStatus(data.enrollmentStatus),
    };

    // VALIDATIONS
    if (student.lastName.length < 2) {
      errors.push("Nom manquant (min 2 caracteres)");
    }
    if (student.firstName.length < 2) {
      errors.push("Prenom manquant (min 2 caracteres)");
    }
    if (!student.birthDate) {
      errors.push("Date de naissance manquante ou invalide");
    }
    if (!student.gender) {
      errors.push("Sexe manquant (M ou F)");
    }
    if (!student.className) {
      errors.push("Classe manquante");
    }
    // Au moins un parent OU tuteur
    const hasFather = student.fatherLastName && student.fatherPhone;
    const hasMother = student.motherLastName && student.motherPhone;
    const hasGuardian = student.guardianLastName && student.guardianPhone;
    if (!hasFather && !hasMother && !hasGuardian) {
      errors.push(
        "Au moins un parent (pere ou mere) ou un tuteur avec numero WhatsApp doit etre renseigne",
      );
    }

    if (student.className) {
      classesTrouvees.add(student.className);
    }

    rows.push({
      lineNumber: i,
      data: errors.length === 0 ? student : null,
      errors,
    });
  }

  return { rows, classesTrouvees };
}
