import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandCoins, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { isDebtTransaction, formatCurrency } from '@/lib/formatters';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import type { Transaction } from '@/types';

interface DebtModalProps {
  open: boolean;
  onClose: () => void;
  onAddDebt: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDuplicateTransaction?: (transaction: Transaction) => void;
}

type DebtFilter = 'ALL' | 'BELUM_LUNAS' | 'LUNAS';

export function DebtModal({
  open,
  onClose,
  onAddDebt,
  onEditTransaction,
  onDuplicateTransaction,
}: DebtModalProps) {
  const { transactions, settings } = useApp();
  const [filter, setFilter] = useState<DebtFilter>('ALL');

  const debtTransactions = transactions.filter((t) => isDebtTransaction(t));

  const totalUnpaid = debtTransactions
    .filter((t) => t.debtStatus !== 'LUNAS')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = debtTransactions
    .filter((t) => t.debtStatus === 'LUNAS')
    .reduce((sum, t) => sum + t.amount, 0);

  const unpaidCount = debtTransactions.filter((t) => t.debtStatus !== 'LUNAS').length;

  const filteredItems = debtTransactions.filter((t) => {
    if (filter === 'BELUM_LUNAS') return t.debtStatus !== 'LUNAS';
    if (filter === 'LUNAS') return t.debtStatus === 'LUNAS';
    return true;
  });

  const fmt = (amount: number) => formatCurrency(amount, settings.currency, settings.locale);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-2xl bg-card border border-border/50 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-border/50 shrink-0 bg-gradient-to-r from-rose-500/5 to-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">Debt Tracker (Catatan Hutang)</h2>
                  <p className="text-xs text-muted-foreground">
                    Status hutang tersimpan terpisah &amp; tidak mengurangi Current Balance hingga dilunasi.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Total Belum Lunas
                  </div>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400 truncate">
                    {fmt(totalUnpaid)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Total Lunas
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {fmt(totalPaid)}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-card border border-border/50">
                  <div className="text-xs text-muted-foreground font-medium mb-1">
                    Hutang Aktif
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {unpaidCount} <span className="text-xs font-normal text-muted-foreground">item</span>
                  </p>
                </div>
              </div>

              {/* Action Bar: Filter Tabs & Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex p-1 bg-muted rounded-xl">
                  {(['ALL', 'BELUM_LUNAS', 'LUNAS'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filter === tab
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'ALL'
                        ? `Semua (${debtTransactions.length})`
                        : tab === 'BELUM_LUNAS'
                        ? `Belum Lunas (${unpaidCount})`
                        : `Lunas (${debtTransactions.length - unpaidCount})`}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onAddDebt}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Hutang
                </button>
              </div>

              {/* Debt Transactions List */}
              <div className="space-y-2 pt-1">
                {filteredItems.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border/50 rounded-2xl">
                    <HandCoins className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {filter === 'ALL'
                        ? 'Belum ada catatan hutang.'
                        : filter === 'BELUM_LUNAS'
                        ? 'Tidak ada hutang yang belum lunas.'
                        : 'Belum ada hutang yang lunas.'}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                      Tambah transaksi baru dengan memilih kategori <span className="font-semibold text-rose-500">Hutang</span>.
                    </p>
                  </div>
                ) : (
                  filteredItems.map((t) => (
                    <TransactionCard
                      key={t.id}
                      transaction={t}
                      onEdit={onEditTransaction}
                      onDuplicate={onDuplicateTransaction}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
