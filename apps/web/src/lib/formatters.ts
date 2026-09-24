const DEFAULT_LOCALE = "fr-FR";
const DEFAULT_CURRENCY = "FCFA";

export function formatCurrency(
  amount: number | string | null | undefined,
  options: { withSymbol?: boolean } = {}
): string {
  const { withSymbol = true } = options;
  if (amount === null || amount === undefined || amount === "") {
    return withSymbol ? `0 ${DEFAULT_CURRENCY}` : "0";
  }

  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return withSymbol ? `0 ${DEFAULT_CURRENCY}` : "0";

  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return withSymbol ? `${formatted} ${DEFAULT_CURRENCY}` : formatted;
}

export function formatDate(
  date: Date | string | null | undefined,
  format: "short" | "long" = "short"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" };

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
}

export function truncate(text: string, maxLength: number, suffix = "…"): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Formate une taille de fichier en octets vers une unite lisible.
 * Ex: 1048576 -> "1.0 MB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Calcule l'age a partir d'une date de naissance.
 */
export function calculateAge(birthDate: Date | string): number {
  const today = new Date();
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Formate un numero de telephone malien.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  return phone;
}
