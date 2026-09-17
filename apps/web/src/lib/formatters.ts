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
