import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/store/AppContext';
import { transactionSchema, type TransactionFormData, type Transaction } from '@/types';
import { generateId, formatDateISO, getDebtPerson, getUniqueDebtPersons } from '@/lib/formatters';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '@/lib/constants';
import { InvestigationModal } from '@/components/investigation/InvestigationModal';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  User,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'income' | 'expense';
  defaultCategory?: string;
  editTransaction?: Transaction;
  duplicateTransaction?: Transaction;
}

export function TransactionForm({
  open,
  onOpenChange,
  defaultType = 'expense',
  defaultCategory = '',
  editTransaction,
  duplicateTransaction,
}: TransactionFormProps) {
  const { transactions, addTransaction, updateTransaction, updateSettings, settings } = useApp();
  const [showInvestigation, setShowInvestigation] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<TransactionFormData | null>(null);

  const initialDebtPerson = editTransaction
    ? (editTransaction.debtPerson || getDebtPerson(editTransaction))
    : duplicateTransaction
    ? (duplicateTransaction.debtPerson || getDebtPerson(duplicateTransaction))
    : '';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editTransaction
      ? {
          amount: editTransaction.amount,
          date: editTransaction.date,
          category: editTransaction.category,
          description: editTransaction.description,
          notes: editTransaction.notes || '',
          type: editTransaction.type,
          debtPerson: initialDebtPerson,
        }
      : duplicateTransaction
      ? {
          amount: duplicateTransaction.amount,
          date: formatDateISO(),
          category: duplicateTransaction.category,
          description: duplicateTransaction.description,
          notes: duplicateTransaction.notes || '',
          type: duplicateTransaction.type,
          debtPerson: initialDebtPerson,
        }
      : {
          amount: undefined,
          date: formatDateISO(),
          category: defaultCategory,
          description: '',
          notes: '',
          type: defaultType,
          debtPerson: '',
        },
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category');
  const selectedDebtPerson = watch('debtPerson') || '';
  const categories = selectedType === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  const isHighRisk = settings.highRiskCategories.includes(selectedCategory);

  const knownPersons = useMemo(() => {
    return getUniqueDebtPersons(transactions, settings.customDebtPersons || ['Ummy', 'Diah']);
  }, [transactions, settings.customDebtPersons]);

  const onSubmit = async (data: TransactionFormData) => {
    // Check if category is high risk
    if (isHighRisk && !editTransaction) {
      setPendingTransaction(data);
      setShowInvestigation(true);
      return;
    }

    await saveTransaction(data);
  };

  const saveTransaction = async (data: TransactionFormData, investigationData?: Transaction['investigationData']) => {
    const now = new Date().toISOString();
    const isDebt = data.category === 'Hutang';
    const cleanDebtPerson = isDebt
      ? (data.debtPerson?.trim() || 'Belum Dikategorikan')
      : undefined;

    if (editTransaction) {
      await updateTransaction(editTransaction.id, {
        ...data,
        isDebt: isDebt ? true : (editTransaction.isDebt ?? false),
        debtPerson: cleanDebtPerson,
        debtStatus: isDebt ? (editTransaction.debtStatus || 'BELUM_LUNAS') : editTransaction.debtStatus,
        updatedAt: now,
      });
    } else {
      const transaction: Transaction = {
        id: generateId(),
        ...data,
        isDebt: isDebt ? true : false,
        debtPerson: cleanDebtPerson,
        debtStatus: isDebt ? 'BELUM_LUNAS' : undefined,
        createdAt: now,
        updatedAt: now,
        investigationData,
      };
      await addTransaction(transaction);
    }

    // Save newly entered debt person to settings custom list if valid
    if (isDebt && cleanDebtPerson && cleanDebtPerson !== 'Belum Dikategorikan') {
      const currentCustom = settings.customDebtPersons || [];
      if (!currentCustom.includes(cleanDebtPerson)) {
        await updateSettings({
          customDebtPersons: [...currentCustom, cleanDebtPerson],
        });
      }
    }

    reset({
      amount: undefined,
      date: formatDateISO(),
      category: defaultCategory,
      description: '',
      notes: '',
      type: defaultType,
      debtPerson: '',
    });
    onOpenChange(false);
  };

  const handleInvestigationComplete = async (investigationData: Transaction['investigationData']) => {
    if (pendingTransaction) {
      await saveTransaction(pendingTransaction, investigationData);
      setPendingTransaction(null);
    }
    setShowInvestigation(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl">
              {editTransaction
                ? 'Edit Transaction'
                : duplicateTransaction
                ? 'Duplicate Transaction'
                : 'Add Transaction'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Type Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setValue('type', 'income')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                  selectedType === 'income'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Income
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'expense')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                  selectedType === 'expense'
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <TrendingDown className="w-4 h-4" />
                Expense
              </button>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount ({settings.currencySymbol})
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                className="mt-1.5 text-2xl font-bold h-14 rounded-xl"
                {...register('amount', { valueAsNumber: true })}
                autoFocus
              />
              {errors.amount && (
                <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <AnimatePresence mode="popLayout">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    const isCatHighRisk = settings.highRiskCategories.includes(cat.name);
                    return (
                      <motion.button
                        key={cat.id}
                        type="button"
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setValue('category', cat.name)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                          isSelected
                            ? 'border-foreground/20 bg-foreground/5 text-foreground'
                            : 'border-transparent bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {cat.name}
                        {isCatHighRisk && (
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
              {errors.category && (
                <p className="text-destructive text-xs mt-1">{errors.category.message}</p>
              )}
              {isHighRisk && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    High risk — Financial Investigation will be required
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Hutang Kepada (Conditional for Category === "Hutang") */}
            {selectedCategory === 'Hutang' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="debtPerson" className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Hutang Kepada
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Pilih atau ketik nama orang</span>
                </div>

                {/* Quick select chips */}
                <div className="flex flex-wrap gap-1.5">
                  {knownPersons.map((person) => {
                    const isSelected = selectedDebtPerson.toLowerCase() === person.toLowerCase();
                    return (
                      <button
                        key={person}
                        type="button"
                        onClick={() => {
                          setValue('debtPerson', person);
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/30'
                            : 'bg-card border-border/50 text-foreground hover:border-rose-500/40 hover:bg-rose-500/10'
                        )}
                      >
                        {person}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setValue('debtPerson', '');
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-dashed border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Nama Baru
                  </button>
                </div>

                {/* Input text field for person name */}
                <div>
                  <Input
                    id="debtPerson"
                    type="text"
                    placeholder="Masukkan nama orang (misal: Ummy, Diah, Ayah...)"
                    className="rounded-xl border-rose-500/30 focus-visible:ring-rose-500"
                    {...register('debtPerson')}
                  />
                  {errors.debtPerson && (
                    <p className="text-destructive text-xs mt-1">{errors.debtPerson.message}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Date */}
            <div>
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                className="mt-1.5 rounded-xl"
                {...register('date')}
              />
              {errors.date && (
                <p className="text-destructive text-xs mt-1">{errors.date.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="What's this for?"
                className="mt-1.5 rounded-xl resize-none"
                rows={2}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-destructive text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="notes"
                placeholder="Any extra details..."
                className="mt-1.5 rounded-xl resize-none"
                rows={2}
                {...register('notes')}
              />
              {errors.notes && (
                <p className="text-destructive text-xs mt-1">{errors.notes.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
            >
              {editTransaction ? 'Update Transaction' : isHighRisk ? 'Begin Investigation →' : 'Save Transaction'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Investigation Modal */}
      <InvestigationModal
        open={showInvestigation}
        onComplete={handleInvestigationComplete}
        onCancel={() => {
          setShowInvestigation(false);
          setPendingTransaction(null);
        }}
        pendingAmount={pendingTransaction?.amount || 0}
        pendingCategory={pendingTransaction?.category || ''}
      />
    </>
  );
}
