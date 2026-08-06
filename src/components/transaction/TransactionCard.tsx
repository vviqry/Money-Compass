import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Transaction } from '@/types';
import { useApp } from '@/store/AppContext';
import { formatCurrency, formatDate, getRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/components/transaction/CategoryIcon';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  showDate?: boolean;
}

export function TransactionCard({ transaction, onEdit, showDate = true }: TransactionCardProps) {
  const { deleteTransaction, settings } = useApp();
  const isIncome = transaction.type === 'income';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onEdit?.(transaction)}
      className="group flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all cursor-pointer"
    >
      {/* Category icon */}
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
          isIncome
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 text-red-600 dark:text-red-400'
        )}
      >
        {getCategoryIcon(transaction.category)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{transaction.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {transaction.category}
          {showDate && ` · ${getRelativeTime(transaction.createdAt)}`}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            'font-bold',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          )}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, settings.currency, settings.locale)}
        </p>
        {showDate && (
          <p className="text-xs text-muted-foreground">{formatDate(transaction.date, 'MMM dd')}</p>
        )}
      </div>

      {/* Delete button (on hover) */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          deleteTransaction(transaction.id);
        }}
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
