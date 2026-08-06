import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useApp } from '@/store/AppContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getCategoryIcon } from '@/components/transaction/CategoryIcon';
import { Search } from 'lucide-react';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { transactions, settings } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const filteredTransactions = useCallback(() => {
    if (!query.trim()) return transactions.slice(0, 10);
    const q = query.toLowerCase();
    return transactions
      .filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          t.date.includes(q)
      )
      .slice(0, 20);
  }, [query, transactions]);

  const results = filteredTransactions();
  const incomeResults = results.filter((t) => t.type === 'income');
  const expenseResults = results.filter((t) => t.type === 'expense');

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search transactions by category, description, amount, or date..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-8">
            <Search className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        </CommandEmpty>

        {incomeResults.length > 0 && (
          <CommandGroup heading="Income">
            {incomeResults.map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => {
                  navigate('/income');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(t.category, 'w-4 h-4')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {formatDate(t.date, 'MMM dd, yyyy')}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  +{formatCurrency(t.amount, settings.currency, settings.locale)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {expenseResults.length > 0 && (
          <CommandGroup heading="Expenses">
            {expenseResults.map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => {
                  navigate('/expense');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(t.category, 'w-4 h-4')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {formatDate(t.date, 'MMM dd, yyyy')}
                  </p>
                </div>
                <span className="text-sm font-bold text-red-500 dark:text-red-400 flex-shrink-0">
                  -{formatCurrency(t.amount, settings.currency, settings.locale)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
