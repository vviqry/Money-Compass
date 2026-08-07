import { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import type { Transaction } from '@/types';
import {
  format,
  parseISO,
  subDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { isDateToday } from '@/lib/formatters';

export type OverviewTab = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface OverviewPoint {
  label: string;
  income: number;
  expense: number;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

function sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function useOverviewChartData(tab: OverviewTab) {
  const { transactions } = useApp();

  return useMemo<OverviewPoint[]>(() => {
    const now = new Date();

    switch (tab) {
      case 'daily': {
        // Income vs expense by hour, for today's transactions.
        const points: OverviewPoint[] = HOUR_LABELS.map((label) => ({ label, income: 0, expense: 0 }));
        transactions
          .filter((t) => isDateToday(t.date))
          .forEach((t) => {
            const hour = parseISO(t.createdAt).getHours();
            const point = points[hour];
            if (!point) return;
            if (t.type === 'income') point.income += t.amount;
            else point.expense += t.amount;
          });
        return points;
      }

      case 'weekly': {
        // Last 7 days, including today.
        const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
        return days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTx = transactions.filter((t) => t.date === dateStr);
          return {
            label: format(day, 'EEE'),
            income: sumByType(dayTx, 'income'),
            expense: sumByType(dayTx, 'expense'),
          };
        });
      }

      case 'monthly': {
        // Every day in the current month.
        const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
        return days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTx = transactions.filter((t) => t.date === dateStr);
          return {
            label: format(day, 'd'),
            income: sumByType(dayTx, 'income'),
            expense: sumByType(dayTx, 'expense'),
          };
        });
      }

      case 'yearly': {
        // Every month, Jan through Dec, of the current year.
        const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) });
        return months.map((month) => {
          const monthKey = format(month, 'yyyy-MM');
          const monthTx = transactions.filter((t) => t.date.startsWith(monthKey));
          return {
            label: format(month, 'MMM'),
            income: sumByType(monthTx, 'income'),
            expense: sumByType(monthTx, 'expense'),
          };
        });
      }
    }
  }, [transactions, tab]);
}
