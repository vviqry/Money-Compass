import { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import type { StatsData, StatsPeriod, CategoryStat, TrendPoint, Transaction } from '@/types';
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { isDateToday, isDateThisMonth, isDebtTransaction } from '@/lib/formatters';

// ─── Main Statistics Hook ────────────────────────────────────────────

export function useStatistics(period: StatsPeriod = 'monthly') {
  const { transactions, settings } = useApp();

  const stats = useMemo<StatsData>(() => {
    const filtered = filterByPeriod(transactions, period);
    const income = filtered.filter((t) => t.type === 'income');
    const expense = filtered.filter((t) => t.type === 'expense' && !isDebtTransaction(t));

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number; type: 'income' | 'expense' }>();
    filtered.forEach((t) => {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0, type: t.type };
      categoryMap.set(t.category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
        type: t.type,
      });
    });

    const totalAmount = totalIncome + totalExpense;
    const categoryBreakdown: CategoryStat[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        count: data.count,
        color: getCategoryColor(category),
        type: data.type,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Largest expense
    const expenseCategories = categoryBreakdown.filter((c) => c.type === 'expense');
    const largestExpense = expenseCategories.length > 0
      ? { category: expenseCategories[0].category, amount: expenseCategories[0].amount }
      : null;

    // Most frequent expense
    const mostFrequentExpense = expenseCategories.length > 0
      ? expenseCategories.reduce((max, c) => (c.count > max.count ? c : max))
      : null;
    const mostFrequent = mostFrequentExpense
      ? { category: mostFrequentExpense.category, count: mostFrequentExpense.count }
      : null;

    // Trend data
    const trendData = computeTrendData(filtered, period);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      savings: totalIncome - totalExpense,
      largestExpense,
      mostFrequentExpense: mostFrequent,
      categoryBreakdown,
      trendData,
    };
  }, [transactions, period]);

  return { stats, settings };
}

// ─── Dashboard Stats Hook ───────────────────────────────────────────

export function useDashboardStats() {
  const { transactions, settings } = useApp();

  return useMemo(() => {
    const todayIncome = transactions
      .filter((t) => t.type === 'income' && isDateToday(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    const todayExpense = transactions
      .filter((t) => t.type === 'expense' && !isDebtTransaction(t) && isDateToday(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = transactions
      .filter((t) => t.type === 'income' && isDateThisMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = transactions
      .filter((t) => t.type === 'expense' && !isDebtTransaction(t) && isDateThisMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense' && !isDebtTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;
    const savings = monthlyIncome - monthlyExpense;

    // Largest expense category this month
    const monthlyExpenses = transactions.filter(
      (t) => t.type === 'expense' && !isDebtTransaction(t) && isDateThisMonth(t.date)
    );
    const categoryTotals = new Map<string, number>();
    monthlyExpenses.forEach((t) => {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + t.amount);
    });
    let largestCategory = { name: '-', amount: 0 };
    categoryTotals.forEach((amount, name) => {
      if (amount > largestCategory.amount) {
        largestCategory = { name, amount };
      }
    });

    // Recent transactions (last 5)
    const recentTransactions = transactions.slice(0, 5);

    return {
      balance,
      todayIncome,
      todayExpense,
      monthlyIncome,
      monthlyExpense,
      savings,
      largestCategory,
      recentTransactions,
      settings,
    };
  }, [transactions, settings]);
}

// ─── Digital Product Stats Hook ─────────────────────────────────────

export function useDigitalProductStats() {
  const { transactions, settings } = useApp();

  return useMemo(() => {
    const digitalTxns = transactions.filter(
      (t) => t.type === 'expense' && settings.highRiskCategories.includes(t.category)
    );

    const totalPurchased = digitalTxns.length;
    const totalSpent = digitalTxns.reduce((sum, t) => sum + t.amount, 0);

    // Count completed from investigation data
    const completedCourses = digitalTxns.filter(
      (t) => t.investigationData?.gate6_completedPrevious === true
    ).length;

    const completionRate = totalPurchased > 0
      ? (completedCourses / totalPurchased) * 100
      : 0;

    // Average ROI from gate 4 answers
    const roiAnswers = digitalTxns
      .filter((t) => t.investigationData?.gate4_percentageGenerated !== undefined)
      .map((t) => t.investigationData!.gate4_percentageGenerated);
    const estimatedROI = roiAnswers.length > 0
      ? roiAnswers.reduce((sum, v) => sum + v, 0) / roiAnswers.length
      : 0;

    const largestPurchase = digitalTxns.length > 0
      ? Math.max(...digitalTxns.map((t) => t.amount))
      : 0;

    // Monthly average
    const months = new Set(digitalTxns.map((t) => t.date.substring(0, 7)));
    const monthlyAverage = months.size > 0 ? totalSpent / months.size : 0;

    // Monthly spending (current month, all expenses)
    const monthlySpending = transactions
      .filter((t) => t.type === 'expense' && isDateThisMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    // Current savings
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const currentSavings = totalIncome - totalExpense;

    // Digital product spending this month
    const digitalMonthly = digitalTxns
      .filter((t) => isDateThisMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalPurchased,
      totalSpent,
      completedCourses,
      completionRate,
      estimatedROI,
      largestPurchase,
      monthlyAverage,
      currentSavings,
      monthlySpending,
      digitalMonthly,
    };
  }, [transactions, settings]);
}

// ─── Helper Functions ───────────────────────────────────────────────

function filterByPeriod(transactions: Transaction[], period: StatsPeriod): Transaction[] {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'daily':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'weekly':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'yearly':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
  }

  return transactions.filter((t) =>
    isWithinInterval(parseISO(t.date), { start, end })
  );
}

function computeTrendData(transactions: Transaction[], period: StatsPeriod): TrendPoint[] {
  const now = new Date();
  let intervals: Date[];
  let formatStr: string;

  switch (period) {
    case 'daily':
      intervals = eachDayOfInterval({
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      });
      formatStr = 'EEE';
      break;
    case 'weekly':
      intervals = eachWeekOfInterval(
        { start: startOfMonth(now), end: endOfMonth(now) },
        { weekStartsOn: 1 }
      );
      formatStr = "'W'w";
      break;
    case 'monthly':
      intervals = eachMonthOfInterval({
        start: startOfYear(now),
        end: endOfYear(now),
      });
      formatStr = 'MMM';
      break;
    case 'yearly':
      intervals = eachMonthOfInterval({
        start: startOfYear(now),
        end: endOfYear(now),
      });
      formatStr = 'MMM';
      break;
  }

  return intervals.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter((t) => {
      if (period === 'monthly' || period === 'yearly') {
        return t.date.substring(0, 7) === dateStr.substring(0, 7);
      }
      if (period === 'weekly') {
        const weekStart = startOfWeek(parseISO(t.date), { weekStartsOn: 1 });
        return format(weekStart, 'yyyy-MM-dd') === format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      }
      return t.date === dateStr;
    });

    return {
      label: format(date, formatStr),
      income: dayTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: dayTransactions.filter((t) => t.type === 'expense' && !isDebtTransaction(t)).reduce((s, t) => s + t.amount, 0),
      date: dateStr,
    };
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  'Shopee Seller': '#f97316',
  'Shopee Affiliate': '#ef4444',
  'Happy Snack House': '#eab308',
  'Gift': '#ec4899',
  'Freelance': '#8b5cf6',
  'Sell Used Items': '#14b8a6',
  'Food': '#f97316',
  'Coffee': '#92400e',
  'Snack': '#ec4899',
  'Electricity': '#eab308',
  'Wifi': '#3b82f6',
  'Internet': '#06b6d4',
  'Transportation': '#6366f1',
  'Business Capital': '#0d9488',
  'Digital Product': '#dc2626',
  'Donation': '#e11d48',
  'Other': '#6b7280',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#6b7280';
}
