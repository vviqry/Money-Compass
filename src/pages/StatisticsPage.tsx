import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStatistics } from '@/hooks/useStatistics';
import { useApp } from '@/store/AppContext';
import { useOutletContext } from 'react-router-dom';
import { StatisticsEmpty } from '@/components/empty/EmptyState';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import type { StatsPeriod } from '@/types';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  PiggyBank,
  TrendingDown,
  Repeat,
  Crown,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const periods: { value: StatsPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

export default function StatisticsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('monthly');
  const { stats } = useStatistics(period);
  const { transactions, settings } = useApp();
  const { onQuickAdd } = useOutletContext<{ onQuickAdd: (type?: 'income' | 'expense') => void }>();

  if (transactions.length === 0) {
    return <StatisticsEmpty onAction={() => onQuickAdd()} />;
  }

  const fmt = (amount: number) => formatCurrency(amount, settings.currency, settings.locale);

  const expenseBreakdown = stats.categoryBreakdown.filter((c) => c.type === 'expense');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as StatsPeriod)}>
          <TabsList className="rounded-xl">
            {periods.map((p) => (
              <TabsTrigger key={p.value} value={p.value} className="rounded-lg text-xs">
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <PiggyBank className="w-4 h-4" />
            Savings
          </div>
          <p className={cn('text-lg font-bold', stats.savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
            {fmt(stats.savings)}
          </p>
        </motion.div>
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <TrendingDown className="w-4 h-4" />
            Largest Expense
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {stats.largestExpense?.category || '-'}
          </p>
          <p className="text-xs text-muted-foreground">{stats.largestExpense ? fmt(stats.largestExpense.amount) : '-'}</p>
        </motion.div>
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Repeat className="w-4 h-4" />
            Most Frequent
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {stats.mostFrequentExpense?.category || '-'}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.mostFrequentExpense ? `${stats.mostFrequentExpense.count} times` : '-'}
          </p>
        </motion.div>
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Crown className="w-4 h-4" />
            Balance
          </div>
          <p className={cn('text-lg font-bold', stats.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
            {fmt(stats.balance)}
          </p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bar Chart: Income vs Expense */}
        <div className="rounded-2xl bg-card/50 border border-border/50 p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Income vs Expense</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Category Breakdown */}
        <div className="rounded-2xl bg-card/50 border border-border/50 p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Expense Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {expenseBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => fmt(Number(value || 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Trend */}
        <div className="md:col-span-2 rounded-2xl bg-card/50 border border-border/50 p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="rounded-2xl bg-card/50 border border-border/50 p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {stats.categoryBreakdown.map((cat) => (
            <div key={cat.category} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm flex-1 min-w-0 truncate">{cat.category}</span>
              <span className="text-xs text-muted-foreground">{formatPercentage(cat.percentage)}</span>
              <span className={cn(
                'text-sm font-medium',
                cat.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
              )}>
                {fmt(cat.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
