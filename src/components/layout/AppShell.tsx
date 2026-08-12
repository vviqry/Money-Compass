import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { SearchDialog } from '@/components/search/SearchDialog';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { CalendarFAB } from '@/components/calendar/CalendarFAB';
import { WishlistFAB } from '@/components/layout/WishlistFAB';
import { RevenueFAB } from '@/components/layout/RevenueFAB';
import { DebtFAB } from '@/components/layout/DebtFAB';
import { WishlistModal } from '@/components/wishlist/WishlistModal';
import { RevenueModal } from '@/components/revenue/RevenueModal';
import { DebtModal } from '@/components/debt/DebtModal';
import type { Transaction } from '@/types';

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense'>('expense');
  const [quickAddCategory, setQuickAddCategory] = useState<string>('');
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [duplicateTx, setDuplicateTx] = useState<Transaction | null>(null);

  const handleQuickAdd = (type?: 'income' | 'expense', category?: string) => {
    setQuickAddType(type || 'expense');
    setQuickAddCategory(category || '');
    setQuickAddOpen(true);
  };

  const handleAddDebt = () => {
    handleQuickAdd('expense', 'Hutang');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-violet-500/5 dark:bg-violet-500/3 blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/3 blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        <Header
          onSearchOpen={() => setSearchOpen(true)}
          onQuickAdd={() => handleQuickAdd()}
        />
        <div className="flex-1 px-4 md:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet context={{ onQuickAdd: handleQuickAdd }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile nav */}
      <MobileNav />

      {/* Floating Action Buttons (stacked: Debt > Revenue > Wishlist > Calendar) */}
      <DebtFAB open={debtOpen} onToggle={() => setDebtOpen(!debtOpen)} />
      <RevenueFAB open={revenueOpen} onToggle={() => setRevenueOpen(!revenueOpen)} />
      <WishlistFAB open={wishlistOpen} onToggle={() => setWishlistOpen(!wishlistOpen)} />
      <CalendarFAB />

      {/* Modals */}
      <DebtModal
        open={debtOpen}
        onClose={() => setDebtOpen(false)}
        onAddDebt={handleAddDebt}
        onEditTransaction={setEditTx}
        onDuplicateTransaction={setDuplicateTx}
      />
      <WishlistModal open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
      <RevenueModal open={revenueOpen} onClose={() => setRevenueOpen(false)} />

      {/* Search */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Quick Add Form */}
      <TransactionForm
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultType={quickAddType}
        defaultCategory={quickAddCategory}
      />

      {/* Edit Form */}
      {editTx && (
        <TransactionForm
          open={!!editTx}
          onOpenChange={(open) => !open && setEditTx(null)}
          editTransaction={editTx}
        />
      )}

      {/* Duplicate Form */}
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
