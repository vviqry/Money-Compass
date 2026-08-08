import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/AppContext';
import { useOutletContext } from 'react-router-dom';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { IncomeEmpty } from '@/components/empty/EmptyState';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Transaction } from '@/types';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IncomePage() {
  const { transactions, settings } = useApp();
  const { onQuickAdd } = useOutletContext<{ onQuickAdd: (type?: 'income' | 'expense') => void }>();
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [duplicateTx, setDuplicateTx] = useState<Transaction | null>(null);

  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by date
  const grouped = incomeTransactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    const dateKey = t.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (incomeTransactions.length === 0) {
    return <IncomeEmpty onAction={() => onQuickAdd('income')} />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Income</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome, settings.currency, settings.locale)}
            </span>
          </p>
        </div>
        <Button
          onClick={() => onQuickAdd('income')}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Add Income
        </Button>
      </div>

      {/* Grouped transactions */}
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {formatDate(date, 'EEEE, MMM dd')}
              </h3>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(
                  grouped[date].reduce((s, t) => s + t.amount, 0),
                  settings.currency,
                  settings.locale
                )}
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {grouped[date].map((t) => (
                  <TransactionCard
                    key={t.id}
                    transaction={t}
                    onEdit={setEditTx}
                    onDuplicate={setDuplicateTx}
                    showDate={false}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

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
    </div>
  );
}
