import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/store/AppContext';
import { CalendarEmpty } from '@/components/empty/EmptyState';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday as checkIsToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { transactions, settings } = useApp();
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Build a map of dates -> { hasIncome, hasExpense }
  const dateMap = useMemo(() => {
    const map = new Map<string, { hasIncome: boolean; hasExpense: boolean }>();
    transactions.forEach((t) => {
      const existing = map.get(t.date) || { hasIncome: false, hasExpense: false };
      if (t.type === 'income') existing.hasIncome = true;
      if (t.type === 'expense') existing.hasExpense = true;
      map.set(t.date, existing);
    });
    return map;
  }, [transactions]);

  const selectedTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return transactions.filter((t) => t.date === selectedDate);
  }, [selectedDate, transactions]);

  const selectedIncome = selectedTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  if (transactions.length === 0) {
    return <CalendarEmpty />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear(year - 1)}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold min-w-[60px] text-center">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, monthIndex) => (
          <MonthGrid
            key={monthIndex}
            year={year}
            month={monthIndex}
            dateMap={dateMap}
            onDateClick={setSelectedDate}
          />
        ))}
      </div>

      {/* Day Detail Sheet */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedDate && formatDate(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </SheetTitle>
          </SheetHeader>

          {selectedDate && (
            <div className="space-y-4 mt-4">
              {/* Day summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedIncome, settings.currency, settings.locale)}
                  </p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Expense</p>
                  <p className="text-sm font-bold text-red-500 dark:text-red-400">
                    {formatCurrency(selectedExpense, settings.currency, settings.locale)}
                  </p>
                </div>
                <div className="bg-accent/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(selectedIncome - selectedExpense, settings.currency, settings.locale)}
                  </p>
                </div>
              </div>

              {/* Transactions */}
              {selectedTransactions.length > 0 ? (
                <div className="space-y-2">
                  {selectedTransactions.map((t) => (
                    <TransactionCard key={t.id} transaction={t} onEdit={setEditTx} showDate={false} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions on this day
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {editTx && (
        <TransactionForm
          open={!!editTx}
          onOpenChange={(open) => !open && setEditTx(null)}
          editTransaction={editTx}
        />
      )}
    </motion.div>
  );
}

function MonthGrid({
  year,
  month,
  dateMap,
  onDateClick,
}: {
  year: number;
  month: number;
  dateMap: Map<string, { hasIncome: boolean; hasExpense: boolean }>;
  onDateClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = endOfMonth(firstDay);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });

  // Monday = 0, Sunday = 6
  const startDayOffset = (getDay(firstDay) + 6) % 7;

  return (
    <div className="rounded-2xl bg-card/50 border border-border/50 p-3">
      <h4 className="text-xs font-semibold text-foreground mb-2 text-center">
        {MONTH_NAMES[month]}
      </h4>
      <div className="grid grid-cols-7 gap-0.5">
        {/* Day labels */}
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[9px] text-muted-foreground/50 font-medium pb-1">
            {d[0]}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: startDayOffset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const data = dateMap.get(dateStr);
          const isCurrentDay = checkIsToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={cn(
                'relative flex flex-col items-center justify-center aspect-square rounded-lg text-[10px] transition-colors hover:bg-accent',
                isCurrentDay && 'bg-violet-500/10 font-bold text-violet-600 dark:text-violet-400'
              )}
            >
              {day.getDate()}
              {/* Dots */}
              {data && (
                <div className="flex gap-0.5 absolute -bottom-0">
                  {data.hasIncome && (
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                  {data.hasExpense && (
                    <div className="w-1 h-1 rounded-full bg-red-500" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
