import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '@/types';
import { useApp } from '@/store/AppContext';
import { formatCurrency, formatDate, getRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/components/transaction/CategoryIcon';
import { DeleteTransactionDialog } from '@/components/transaction/DeleteTransactionDialog';
import { useIsTransactionOpen, setOpenTransactionId } from '@/store/swipeStore';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  showDate?: boolean;
}

const ACTION_WIDTH = 152; // combined width of the revealed Edit + Delete buttons
const OPEN_THRESHOLD = ACTION_WIDTH / 2;
const SNAP_SPRING = { type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.6 };

export function TransactionCard({ transaction, onEdit, showDate = true }: TransactionCardProps) {
  const { deleteTransaction, settings } = useApp();
  const isIncome = transaction.type === 'income';
  const isOpen = useIsTransactionOpen(transaction.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // The card's horizontal offset — driven directly by the gesture, so
  // dragging never triggers a React re-render of this card or its siblings.
  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [-ACTION_WIDTH, -OPEN_THRESHOLD, 0], [1, 0.6, 0]);
  const actionsScale = useTransform(x, [-ACTION_WIDTH, -OPEN_THRESHOLD, 0], [1, 0.88, 0.88]);

  // Single source of truth lives in the swipe store — if another card opens,
  // or something closes this one externally, animate to match with a
  // springy, slightly overshooting "release" feel.
  useEffect(() => {
    const controls = animate(x, isOpen ? -ACTION_WIDTH : 0, SNAP_SPRING);
    return () => controls.stop();
  }, [isOpen, x]);

  // Tapping anywhere outside the open card closes it.
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
    const shouldOpen = info.offset.x < -OPEN_THRESHOLD || info.velocity.x < -400;
    setOpenTransactionId(shouldOpen ? transaction.id : null);
    // Let the click handler see isDraggingRef first; reset shortly after.
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  const handleCardClick = () => {
    if (isDraggingRef.current) return;
    if (isOpen) {
      setOpenTransactionId(null);
      return;
    }
    onEdit?.(transaction);
  };

  const handleEdit = () => {
    setOpenTransactionId(null);
    onEdit?.(transaction);
  };

  const handleDeleteConfirm = () => {
    setOpenTransactionId(null);
    deleteTransaction(transaction.id);
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
      {/* Revealed swipe actions (sit behind the card, only visible once dragged) */}
      <motion.div
        style={{ opacity: actionsOpacity, scale: actionsScale }}
        className="absolute inset-y-0 right-0 flex items-stretch"
        aria-hidden={!isOpen}
      >
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
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.4 }}
        dragMomentum={false}
        whileDrag={{ scale: 0.98 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        transition={SNAP_SPRING}
        className="group relative z-10 flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-accent/40 transition-colors cursor-pointer touch-pan-y select-none"
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
      </motion.div>

      <DeleteTransactionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  );
}
