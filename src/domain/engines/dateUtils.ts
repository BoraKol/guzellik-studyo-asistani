export const TURKISH_WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

export const TURKISH_MONTHS_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
] as const;

const MS_PER_DAY = 86_400_000;

/**
 * Formats a Date object as local YYYY-MM-DD.
 */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds (or subtracts) calendar days to a YYYY-MM-DD date string safely in UTC noon to avoid DST drift.
 */
export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const rd = String(dt.getUTCDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

/**
 * Returns whole calendar day difference (target - base).
 * Positive: target is in the future. Negative: target is in the past.
 */
export function diffDaysIso(baseIso: string, targetIso: string): number {
  const [by, bm, bd] = baseIso.split('-').map(Number);
  const [ty, tm, td] = targetIso.split('-').map(Number);
  const baseMs = Date.UTC(by, bm - 1, bd, 12, 0, 0);
  const targetMs = Date.UTC(ty, tm - 1, td, 12, 0, 0);
  return Math.round((targetMs - baseMs) / MS_PER_DAY);
}

/**
 * Formats YYYY-MM-DD as readable Turkish short date (e.g., "24 Kas 2026").
 */
export function formatShortDateTr(isoDate: string): string {
  if (!isoDate || !isoDate.includes('-')) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const monthLabel = TURKISH_MONTHS_SHORT[(m - 1) % 12] ?? '';
  return `${d} ${monthLabel} ${y}`;
}

/**
 * Parses "HH:MM" time string into minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 9 * 60;
  const [hRaw, mRaw] = timeStr.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 9 * 60;
  const clampedH = Math.max(0, Math.min(23, Math.floor(h)));
  const clampedM = Math.max(0, Math.min(59, Math.floor(m)));
  return clampedH * 60 + clampedM;
}

/**
 * Formats minutes since midnight back to zero-padded "HH:MM".
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const safe = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
