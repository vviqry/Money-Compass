import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { Pencil, Copy, Trash2, CheckCircle2, Clock } from 'lucide-react';
import type { Transaction } from '@/types';
import { useApp } from '@/store/AppContext';
import {
  formatCurrency,
  formatDate,
  getRelativeTime,
  isDebtTransaction,
  getDebtPerson,
  generateId,
  formatDateISO,
} from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/components/transaction/CategoryIcon';
import { DeleteTransactionDialog } from '@/components/transaction/DeleteTransactionDialog';
import { useIsTransactionOpen, setOpenTransactionId } from '@/store/swipeStore';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  showDate?: boolean;
}

const SNAP_SPRING = { type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.6 };

export function TransactionCard({
  transaction,
  onEdit,
  onDuplicate,
  showDate = true,
}: TransactionCardProps) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, settings } = useApp();
  const isIncome = transaction.type === 'income';
  const isDebt = isDebtTransaction(transaction);
  const isLunas = transaction.debtStatus === 'LUNAS';
  const debtPerson = isDebt ? getDebtPerson(transaction) : null;

  const actionWidth = isDebt ? 312 : 228;
  const openThreshold = actionWidth / 2;

  const isOpen = useIsTransactionOpen(transaction.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [-actionWidth, -openThreshold, 0], [1, 0.6, 0]);
  const actionsScale = useTransform(x, [-actionWidth, -openThreshold, 0], [1, 0.88, 0.88]);

  useEffect(() => {
    const controls = animate(x, isOpen ? -actionWidth : 0, SNAP_SPRING);
    return () => controls.stop();
  }, [isOpen, actionWidth, x]);

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenTransactionId(null);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const shouldOpen = info.offset.x < -openThreshold || info.velocity.x < -400;
    setOpenTransactionId(shouldOpen ? transaction.id : null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  const handleCardClick = () => {
    if (isDraggingRef.current) return;
    if (isOpen) {
      setOpenTransactionId(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenTransactionId(isOpen ? null : transaction.id);
  };

  const handleToggleLunas = async () => {
    setOpenTransactionId(null);
    const now = new Date().toISOString();

    if (!isLunas) {
      // Mark as Lunas & generate a new settlement expense transaction
      const settlementId = generateId();
      const settlementTx: Transaction = {
        id: settlementId,
        amount: transaction.amount,
        date: formatDateISO(),
        category: 'Other',
        description: `Pelunasan: ${transaction.description}`,
        type: 'expense',
        createdAt: now,
        updatedAt: now,
        isDebt: false,
        relatedDebtId: transaction.id,
      };

      await addTransaction(settlementTx);
      await updateTransaction(transaction.id, {
        isDebt: true,
        debtStatus: 'LUNAS',
        linkedExpenseId: settlementId,
      });
    } else {
      // Toggle back to Belum Lunas & delete generated settlement expense
      const linkedExpense = transactions.find(
        (t) => t.relatedDebtId === transaction.id || (transaction.linkedExpenseId && t.id === transaction.linkedExpenseId)
      );

      if (linkedExpense) {
        await deleteTransaction(linkedExpense.id);
      }

      await updateTransaction(transaction.id, {
        isDebt: true,
        debtStatus: 'BELUM_LUNAS',
        linkedExpenseId: undefined,
      });
    }
  };

  const handleEdit = () => {
    setOpenTransactionId(null);
    onEdit?.(transaction);
  };

  const handleDuplicate = () => {
    setOpenTransactionId(null);
    onDuplicate?.(transaction);
  };

  const handleDeleteConfirm = async () => {
    setOpenTransactionId(null);
    // If it's a debt card with a linked settlement expense, delete that as well
    if (isDebt) {
      const linkedExpense = transactions.find(
        (t) => t.relatedDebtId === transaction.id || (transaction.linkedExpenseId && t.id === transaction.linkedExpenseId)
      );
      if (linkedExpense) {
        await deleteTransaction(linkedExpense.id);
      }
    }
    await deleteTransaction(transaction.id);
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Revealed swipe actions */}
      <motion.div
        style={{ opacity: actionsOpacity, scale: actionsScale }}
        className="absolute inset-y-0 right-0 flex items-stretch"
        aria-hidden={!isOpen}
      >
        {isDebt && (
          <button
            type="button"
            onClick={handleToggleLunas}
            tabIndex={isOpen ? 0 : -1}
            className="w-[84px] flex flex-col items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:brightness-90 transition-all shadow-inner"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isLunas ? 'Belum Lunas' : 'Lunas'}
          </button>
        )}
        <button
          type="button"
          onClick={handleEdit}
          tabIndex={isOpen ? 0 : -1}
          className="w-[76px] flex flex-col items-center justify-center gap-1 bg-blue-500 text-white text-xs font-medium active:brightness-90 transition-[filter]"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          tabIndex={isOpen ? 0 : -1}
          className="w-[76px] flex flex-col items-center justify-center gap-1 bg-violet-600 text-white text-xs font-medium active:brightness-90 transition-[filter]"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          tabIndex={isOpen ? 0 : -1}
          className="w-[76px] flex flex-col items-center justify-center gap-1 bg-red-500 text-white text-xs font-medium rounded-r-2xl active:brightness-90 transition-[filter]"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </motion.div>

      {/* Foreground draggable card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -actionWidth, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.4 }}
        dragMomentum={false}
        whileDrag={{ scale: 0.98 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        transition={SNAP_SPRING}
        className="group relative z-10 flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-accent/40 transition-colors cursor-pointer touch-pan-y select-none"
      >
        {/* Category icon */}
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
            isDebt
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : isIncome
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          )}
        >
          {getCategoryIcon(transaction.category)}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{transaction.description}</p>
            {isDebt && (
              isLunas ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Lunas
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                  <Clock className="w-3 h-3" /> Belum Lunas
                </span>
              )
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
            {isDebt && debtPerson && debtPerson !== 'Belum Dikategorikan' && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                Kepada: {debtPerson}
              </span>
            )}
            <span>{transaction.category}</span>
            {showDate && <span>· {getRelativeTime(transaction.createdAt)}</span>}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p
            className={cn(
              'font-bold',
              isDebt
                ? 'text-rose-600 dark:text-rose-400'
                : isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            )}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount, settings.currency, settings.locale)}
          </p>
          {showDate && (
            <p className="text-xs text-muted-foreground">{formatDate(transaction.date, 'MMM dd')}</p>
          )}
        </div>
      </motion.div>

      <DeleteTransactionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  );
}
