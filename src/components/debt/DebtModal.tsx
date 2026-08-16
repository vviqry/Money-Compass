import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HandCoins,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  Users,
  UserPlus,
  ReceiptText,
  Filter,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { isDebtTransaction, formatCurrency, getDebtPerson, getUniqueDebtPersons } from '@/lib/formatters';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import type { Transaction } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DebtModalProps {
  open: boolean;
  onClose: () => void;
  onAddDebt: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDuplicateTransaction?: (transaction: Transaction) => void;
}

type DebtStatusFilter = 'ALL' | 'BELUM_LUNAS' | 'LUNAS';

export function DebtModal({
  open,
  onClose,
  onAddDebt,
  onEditTransaction,
  onDuplicateTransaction,
}: DebtModalProps) {
  const { transactions, settings, updateSettings } = useApp();
  const [statusFilter, setStatusFilter] = useState<DebtStatusFilter>('ALL');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  // State for Add Person inline dialog
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const debtTransactions = useMemo(
    () => transactions.filter((t) => isDebtTransaction(t)),
    [transactions]
  );

  // Dynamic Total calculations
  const totalUnpaid = useMemo(
    () =>
      debtTransactions
        .filter((t) => t.debtStatus !== 'LUNAS')
        .reduce((sum, t) => sum + t.amount, 0),
    [debtTransactions]
  );

  const totalPaid = useMemo(
    () =>
      debtTransactions
        .filter((t) => t.debtStatus === 'LUNAS')
        .reduce((sum, t) => sum + t.amount, 0),
    [debtTransactions]
  );

  const unpaidCount = useMemo(
    () => debtTransactions.filter((t) => t.debtStatus !== 'LUNAS').length,
    [debtTransactions]
  );

  // Unique list of persons from transactions + custom registered list in settings
  const uniquePersons = useMemo(() => {
    return getUniqueDebtPersons(
      transactions,
      settings.customDebtPersons || ['Ummy', 'Diah']
    );
  }, [transactions, settings.customDebtPersons]);

  // Aggregate stats per person
  const personStats = useMemo(() => {
    const map: Record<
      string,
      { total: number; unpaid: number; paid: number; count: number }
    > = {};

    // Initialize all known persons
    uniquePersons.forEach((person) => {
      map[person] = { total: 0, unpaid: 0, paid: 0, count: 0 };
    });

    // Accumulate amounts
    debtTransactions.forEach((t) => {
      const person = getDebtPerson(t);
      if (!map[person]) {
        map[person] = { total: 0, unpaid: 0, paid: 0, count: 0 };
      }
      map[person].total += t.amount;
      map[person].count += 1;
      if (t.debtStatus === 'LUNAS') {
        map[person].paid += t.amount;
      } else {
        map[person].unpaid += t.amount;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => (b.unpaid !== a.unpaid ? b.unpaid - a.unpaid : b.total - a.total));
  }, [debtTransactions, uniquePersons]);

  // Filtered transactions for the Rincian list
  const filteredItems = useMemo(() => {
    return debtTransactions.filter((t) => {
      // Filter by person if selected
      if (selectedPerson) {
        const p = getDebtPerson(t);
        if (p.toLowerCase() !== selectedPerson.toLowerCase()) {
          return false;
        }
      }

      // Filter by payment status
      if (statusFilter === 'BELUM_LUNAS') return t.debtStatus !== 'LUNAS';
      if (statusFilter === 'LUNAS') return t.debtStatus === 'LUNAS';
      return true;
    });
  }, [debtTransactions, selectedPerson, statusFilter]);

  const fmt = (amount: number) =>
    formatCurrency(amount, settings.currency, settings.locale);

  const handleSaveNewPerson = async () => {
    const trimmed = newPersonName.trim();
    if (!trimmed) return;

    const currentList = settings.customDebtPersons || ['Ummy', 'Diah'];
    if (!currentList.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      await updateSettings({
        customDebtPersons: [...currentList, trimmed],
      });
    }

    setSelectedPerson(trimmed);
    setNewPersonName('');
    setIsAddingPerson(false);
  };

  const handleTogglePersonFilter = (personName: string) => {
    if (selectedPerson === personName) {
      setSelectedPerson(null); // Deselect / reset to all
    } else {
      setSelectedPerson(personName);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative w-full max-w-2xl bg-card border border-border/60 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
          >
            {/* ─── Header ────────────────────────────────────────── */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/50 shrink-0 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground tracking-tight">HUTANG</h2>
                  <p className="text-xs text-muted-foreground">
                    Sistem pengelolaan &amp; rincian hutang berdasarkan orang
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ─── Scrollable Body ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {/* ─── 1. TOTAL HUTANG HERO CARD ─────────────────────── */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-500 to-red-700 p-5 sm:p-6 text-white shadow-xl shadow-rose-500/20">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-rose-100/80">
                      TOTAL HUTANG AKTIF
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold backdrop-blur-md">
                      {unpaidCount} Belum Lunas
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1.5 mb-4">
                    {fmt(totalUnpaid)}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-rose-100" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-rose-100/75 leading-none">Belum Lunas</p>
                        <p className="text-xs sm:text-sm font-bold truncate mt-0.5">{fmt(totalUnpaid)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-rose-100/75 leading-none">Sudah Lunas</p>
                        <p className="text-xs sm:text-sm font-bold truncate mt-0.5">{fmt(totalPaid)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative background lights */}
                <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10 blur-xl pointer-events-none" />
              </div>

              {/* ─── 2. KATEGORI HUTANG (ORANG) ───────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-500" />
                    <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                      KATEGORI HUTANG
                    </h4>
                  </div>

                  <button
                    onClick={() => setIsAddingPerson(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>

                {/* Inline form to add new person */}
                <AnimatePresence>
                  {isAddingPerson && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <UserPlus className="w-4 h-4" />
                        Tambah Nama Orang / Kategori Baru
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          placeholder="Nama orang (misal: Ayah, Jepri...)"
                          className="h-10 rounded-xl text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveNewPerson();
                            if (e.key === 'Escape') setIsAddingPerson(false);
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleSaveNewPerson}
                          className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
                        >
                          Simpan
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingPerson(false);
                            setNewPersonName('');
                          }}
                          className="h-10 px-3 rounded-xl text-xs text-muted-foreground shrink-0"
                        >
                          Batal
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Person Categories Grid / Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {personStats.map((person) => {
                    const isSelected =
                      selectedPerson?.toLowerCase() === person.name.toLowerCase();
                    const hasUnpaid = person.unpaid > 0;
                    return (
                      <motion.button
                        key={person.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTogglePersonFilter(person.name)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
                            : 'bg-card/70 hover:bg-card border-border/50 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {person.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {person.count} tx
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between w-full">
                          <span
                            className={`text-base font-extrabold ${
                              hasUnpaid
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {fmt(person.unpaid)}
                          </span>
                          {isSelected ? (
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                              Aktif
                            </span>
                          ) : !hasUnpaid && person.count > 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Lunas ✓
                            </span>
                          ) : null}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ─── 3. RINCIAN HUTANG ──────────────────────────────── */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-rose-500" />
                    <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                      RINCIAN HUTANG
                    </h4>
                    {selectedPerson && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold border border-rose-500/20 flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        {selectedPerson}
                        <button
                          onClick={() => setSelectedPerson(null)}
                          className="hover:text-foreground ml-0.5"
                          title="Tampilkan semua orang"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Actions: Filter Status & Tambah Hutang */}
                  <div className="flex items-center gap-2">
                    <div className="flex p-0.5 bg-muted rounded-xl">
                      {(['ALL', 'BELUM_LUNAS', 'LUNAS'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStatusFilter(tab)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            statusFilter === tab
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {tab === 'ALL' ? 'Semua' : tab === 'BELUM_LUNAS' ? 'Belum Lunas' : 'Lunas'}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={onAddDebt}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Hutang
                    </button>
                  </div>
                </div>

                {/* List of Debt Transactions */}
                <div className="space-y-2 pt-1">
                  {filteredItems.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-border/50 rounded-3xl bg-muted/20">
                      <HandCoins className="w-9 h-9 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {selectedPerson
                          ? `Belum ada catatan hutang untuk "${selectedPerson}".`
                          : statusFilter === 'BELUM_LUNAS'
                          ? 'Tidak ada hutang yang belum lunas.'
                          : statusFilter === 'LUNAS'
                          ? 'Belum ada hutang yang lunas.'
                          : 'Belum ada catatan transaksi hutang.'}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                        Klik tombol <span className="font-semibold text-rose-500">+ Tambah Hutang</span> untuk mencatat hutang baru.
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
