import { format, formatDistanceToNow, isToday, isThisWeek, isThisMonth, isThisYear, parseISO } from 'date-fns';

// ─── Currency Formatting ─────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  if (amount >= 1_000_000_000) {
    return `${formatCurrency(Math.round(amount / 1_000_000_000), currency, locale)}B`;
  }
  if (amount >= 1_000_000) {
    return `${formatCurrency(Math.round(amount / 1_000_000), currency, locale)}M`;
  }
  if (amount >= 1_000) {
    return `${formatCurrency(Math.round(amount / 1_000), currency, locale)}K`;
  }
  return formatCurrency(amount, currency, locale);
}

// ─── Date Formatting ─────────────────────────────────────────────────

export function formatDate(date: string | Date, fmt: string = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'MMM dd');
}

export function formatDateFull(date: string | Date): string {
  return formatDate(date, 'EEEE, MMMM dd, yyyy');
}

export function formatDateISO(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// ─── Percentage Formatting ───────────────────────────────────────────

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Number Formatting ──────────────────────────────────────────────

export function formatNumber(value: number, locale: string = 'id-ID'): string {
  return new Intl.NumberFormat(locale).format(value);
}

// ─── Date Period Checks ─────────────────────────────────────────────

export function isDateToday(date: string): boolean {
  return isToday(parseISO(date));
}

export function isDateThisWeek(date: string): boolean {
  return isThisWeek(parseISO(date), { weekStartsOn: 1 });
}

export function isDateThisMonth(date: string): boolean {
  return isThisMonth(parseISO(date));
}

export function isDateThisYear(date: string): boolean {
  return isThisYear(parseISO(date));
}

// ─── Transaction Amount Display ─────────────────────────────────────

export function formatTransactionAmount(
  amount: number,
  type: 'income' | 'expense',
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${formatCurrency(amount, currency, locale)}`;
}

// ─── Generate Unique ID ─────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Debt Transaction Check ──────────────────────────────────────────

export function isDebtTransaction(t: { isDebt?: boolean; category?: string } | null | undefined): boolean {
  if (!t) return false;
  return Boolean(t.isDebt === true || t.category === 'Hutang');
}
