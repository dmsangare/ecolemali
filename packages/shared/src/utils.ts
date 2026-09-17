/**
 * SIS-MALI — Utilitaires partagés (formatage, calculs)
 */

import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  MATRICULE_PREFIX,
  MATRICULE_SEQUENCE_LENGTH,
} from './constants';

// ============================================================
// FORMATAGE MONTANTS (FCFA)
// ============================================================

export function formatCurrency(
  amount: number | string | null | undefined,
  options: { withSymbol?: boolean; locale?: string } = {},
): string {
  const { withSymbol = true, locale = DEFAULT_LOCALE } = options;
  if (amount === null || amount === undefined || amount === '') return withSymbol ? `0 ${DEFAULT_CURRENCY}` : '0';

  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return withSymbol ? `0 ${DEFAULT_CURRENCY}` : '0';

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return withSymbol ? `${formatted} ${DEFAULT_CURRENCY}` : formatted;
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================================
// FORMATAGE DATES
// ============================================================

export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'numeric' = 'short',
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : format === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'numeric', year: 'numeric' };

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    ...options,
    timeZone: DEFAULT_TIMEZONE,
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE,
  }).format(d);
}

export function toISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================
// MATRICULE
// ============================================================

export function buildMatricule(year: number, sequence: number): string {
  return `${MATRICULE_PREFIX}-${year}-${String(sequence).padStart(MATRICULE_SEQUENCE_LENGTH, '0')}`;
}

export function parseMatricule(matricule: string): { year: number; sequence: number } | null {
  const match = matricule.match(/^SIS-(\d{4})-(\d+)$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), sequence: parseInt(match[2], 10) };
}

export function isValidMatricule(matricule: string): boolean {
  return /^SIS-\d{4}-\d{6}$/.test(matricule);
}

// ============================================================
// CALCUL DES MOYENNES
// ============================================================

export function calculateWeightedAverage(
  grades: Array<{ value: number | null; coefficient: number }>,
): number | null {
  const validGrades = grades.filter((g) => g.value !== null && !isNaN(g.value as number));
  if (validGrades.length === 0) return null;

  const totalWeighted = validGrades.reduce(
    (sum, g) => sum + (g.value as number) * g.coefficient,
    0,
  );
  const totalCoefficients = validGrades.reduce((sum, g) => sum + g.coefficient, 0);
  if (totalCoefficients === 0) return null;

  return Math.round((totalWeighted / totalCoefficients) * 100) / 100;
}

export function calculateReportAverage(
  subjectAverages: Array<{ average: number | null; coefficient: number }>,
): number | null {
  const valid = subjectAverages.filter((s) => s.average !== null);
  if (valid.length === 0) return null;

  const totalWeighted = valid.reduce(
    (sum, s) => sum + (s.average as number) * s.coefficient,
    0,
  );
  const totalCoefficients = valid.reduce((sum, s) => sum + s.coefficient, 0);
  if (totalCoefficients === 0) return null;

  return Math.round((totalWeighted / totalCoefficients) * 100) / 100;
}

export function computeRank(
  average: number,
  allAverages: number[],
): { rank: number; exAequo: number } {
  const sorted = [...allAverages].sort((a, b) => b - a);
  const rank = sorted.findIndex((v) => Math.abs(v - average) < 0.0001) + 1;
  const exAequo = sorted.filter((v) => Math.abs(v - average) < 0.0001).length;
  return { rank, exAequo };
}

export function determineDecision(
  average: number,
  thresholds: { ADMIS: number; PASSE: number } = { ADMIS: 10, PASSE: 8 },
): 'ADMIS' | 'PASSE' | 'REDOUBLE' {
  if (average >= thresholds.ADMIS) return 'ADMIS';
  if (average >= thresholds.PASSE) return 'PASSE';
  return 'REDOUBLE';
}

// ============================================================
// VALIDATION
// ============================================================

export function isValidMaliPhone(phone: string): boolean {
  return /^(\+223)?[2-9]\d{7}$/.test(phone);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// SLUG ET NORMALISATION
// ============================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ============================================================
// TRONCATURE ET RÉSUMÉ
// ============================================================

export function truncate(text: string, maxLength: number, suffix = '…'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ============================================================
// FICHIERS
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function fileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

// ============================================================
// DIVERS
// ============================================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}