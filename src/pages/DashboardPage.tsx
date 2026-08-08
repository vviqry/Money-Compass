import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardStats } from '@/hooks/useStatistics';
import { useApp } from '@/store/AppContext';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { OverviewChart } from '@/components/dashboard/OverviewChart';
import { DashboardEmpty } from '@/components/empty/EmptyState';
import type { Transaction } from '@/types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

export default function DashboardPage() {
  const dashStats = useDashboardStats();
  const { transactions, settings } = useApp();
  const { onQuickAdd } = useOutletContext<{ onQuickAdd: (type?: 'income' | 'expense') => void }>();
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [duplicateTx, setDuplicateTx] = useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return <DashboardEmpty onAction={() => onQuickAdd()} />;
  }

  const fmt = (amount: number) => formatCurrency(amount, settings.currency, settings.locale);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-5xl"
    >
      {/* Balance Hero Card */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 md:p-8 text-white"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
            <Wallet className="w-4 h-4" />
            Current Balance
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{fmt(dashStats.balance)}</h2>
          <div className="flex gap-4 md:gap-8">
            <div>
              <div className="flex items-center gap-1 text-emerald-300 text-xs mb-1">
                <ArrowUpRight className="w-3 h-3" />
                Today's Income
              </div>
              <p className="font-semibold text-lg">{fmt(dashStats.todayIncome)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-red-300 text-xs mb-1">
                <ArrowDownRight className="w-3 h-3" />
                Today's Expense
              </div>
              <p className="font-semibold text-lg">{fmt(dashStats.todayExpense)}</p>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
      </motion.div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Monthly Income"
          value={fmt(dashStats.monthlyIncome)}
          trend="up"
        />
        <StatCard
          icon={<TrendingDown className="w-4 h-4" />}
          label="Monthly Expense"
          value={fmt(dashStats.monthlyExpense)}
          trend="down"
        />
        <StatCard
          icon={<PiggyBank className="w-4 h-4" />}
          label="Savings"
          value={fmt(dashStats.savings)}
          trend={dashStats.savings >= 0 ? 'up' : 'down'}
        />
        <StatCard
          icon={<Crown className="w-4 h-4" />}
          label="Top Expense"
          value={dashStats.largestCategory.name}
          subValue={fmt(dashStats.largestCategory.amount)}
        />
      </div>

      {/* Chart */}
      <motion.div variants={itemVariants}>
        <OverviewChart />
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Recent Transactions</h3>
          <button
            onClick={() => onQuickAdd()}
            className="text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add New
          </button>
        </div>
        <div className="space-y-2">
          {dashStats.recentTransactions.map((t) => (
            <TransactionCard
              key={t.id}
              transaction={t}
              onEdit={setEditTx}
              onDuplicate={setDuplicateTx}
            />
          ))}
        </div>
      </motion.div>

      {editTx && (
        <TransactionForm
          open={!!editTx}
          onOpenChange={(open) => !open && setEditTx(null)}
          editTransaction={editTx}
        />
      )}

      {duplicateTx && (
        <TransactionForm
          open={!!duplicateTx}
          onOpenChange={(open) => !open && setDuplicateTx(null)}
          duplicateTransaction={duplicateTx}
        />
      )}

      {/* Mobile FAB */}
      <motion.button
        onClick={() => onQuickAdd()}
        className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm p-4"
    >
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
        {icon}
        {label}
      </div>
      <p className={cn(
        'text-lg font-bold truncate',
        trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
        trend === 'down' && 'text-red-500 dark:text-red-400',
        !trend && 'text-foreground'
      )}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{subValue}</p>
      )}
    </motion.div>
  );
}
