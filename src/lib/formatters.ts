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

// ─── Debt Person Helpers ─────────────────────────────────────────────

export function getDebtPerson(
  t: { debtPerson?: string; category?: string; description?: string } | null | undefined
): string {
  if (!t) return 'Belum Dikategorikan';

  if (t.debtPerson && t.debtPerson.trim().length > 0) {
    return t.debtPerson.trim();
  }

  // Deterministic matching for known existing legacy transactions
  const desc = t.description || '';
  if (/\bUmmy\b/i.test(desc)) {
    return 'Ummy';
  }
  if (/\bDiah\b/i.test(desc)) {
    return 'Diah';
  }

  // Safe pattern fallback extraction for "Hutang ka/ke/kepada [Nama]"
  const match = desc.match(/(?:hutang\s+(?:ka|ke|kepada)\s+)([A-Za-z0-9\-_]+)/i);
  if (match && match[1]) {
    const extracted = match[1].trim();
    return extracted.charAt(0).toUpperCase() + extracted.slice(1);
  }

  return 'Belum Dikategorikan';
}

export function getUniqueDebtPersons(
  transactions: { category?: string; isDebt?: boolean; debtPerson?: string; description?: string }[],
  customPersons: string[] = []
): string[] {
  const personsSet = new Set<string>();

  // Add custom registered persons from settings first
  customPersons.forEach((p) => {
    if (p && p.trim()) personsSet.add(p.trim());
  });

  // Extract from all debt transactions
  transactions
    .filter((t) => isDebtTransaction(t))
    .forEach((t) => {
      const person = getDebtPerson(t);
      if (person && person !== 'Belum Dikategorikan') {
        personsSet.add(person);
      }
    });

  return Array.from(personsSet).sort((a, b) => a.localeCompare(b));
}
