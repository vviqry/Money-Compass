import { motion } from 'framer-motion';
import { HandCoins } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { isDebtTransaction } from '@/lib/formatters';

interface DebtFABProps {
  open: boolean;
  onToggle: () => void;
}

export function DebtFAB({ onToggle }: DebtFABProps) {
  const { transactions } = useApp();

  const unpaidCount = transactions.filter(
    (t) => isDebtTransaction(t) && t.debtStatus !== 'LUNAS'
  ).length;

  return (
    <motion.button
      onClick={onToggle}
      className="fixed bottom-72 md:bottom-56 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/30 flex items-center justify-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.8 }}
      title="Debt Tracker (Hutang)"
    >
      <HandCoins className="w-6 h-6" />

      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-white/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Unpaid debt badge count */}
      {unpaidCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-white text-rose-600 text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-md border border-rose-200">
          {unpaidCount > 99 ? '99+' : unpaidCount}
        </span>
      )}
    </motion.button>
  );
}
