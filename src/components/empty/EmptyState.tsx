import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const floatingVariants = {
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      {/* Floating illustration */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-500/10 dark:to-indigo-500/10 flex items-center justify-center backdrop-blur-sm border border-violet-500/10">
          {icon || (
            <Sparkles className="w-10 h-10 text-violet-500 dark:text-violet-400" />
          )}
        </div>
        {/* Decorative orbs */}
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-400/60"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-violet-400/60"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      {/* Text */}
      <motion.h3
        variants={itemVariants}
        className="text-xl font-semibold text-foreground mb-2 text-center"
      >
        {title}
      </motion.h3>

      <motion.p
        variants={itemVariants}
        className="text-muted-foreground text-center max-w-md leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Action button */}
      {actionLabel && onAction && (
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
        >
          <TrendingUp className="w-4 h-4" />
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Preset Empty States ─────────────────────────────────────────────

export function DashboardEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="Your financial journey starts here"
      description="Add your first transaction to unlock powerful insights about your spending habits and financial behavior."
      actionLabel="Add First Transaction"
      onAction={onAction}
    />
  );
}

export function IncomeEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="No income recorded yet"
      description="Start tracking your income sources to understand where your money comes from and build a complete financial picture."
      actionLabel="Record Income"
      onAction={onAction}
    />
  );
}

export function ExpenseEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="No expenses tracked — a clean slate"
      description="Track your expenses to discover patterns, identify areas for improvement, and make informed financial decisions."
      actionLabel="Track Expense"
      onAction={onAction}
    />
  );
}

export function CalendarEmpty() {
  return (
    <EmptyState
      title="Your financial calendar awaits"
      description="Start tracking transactions to see your financial activity come alive on the calendar with visual indicators."
    />
  );
}

export function StatisticsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="Insights unlock with data"
      description="Add transactions to unlock charts, trends, and category breakdowns that reveal your financial patterns."
      actionLabel="Add Transaction"
      onAction={onAction}
    />
  );
}

export function SearchEmpty() {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search query or explore different categories."
    />
  );
}
