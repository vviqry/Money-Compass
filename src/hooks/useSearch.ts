import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/store/AppContext';
import type { SearchResult } from '@/types';

export function useSearch() {
  const { transactions } = useApp();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();

    const matches: SearchResult[] = [];

    transactions.forEach((transaction) => {
      // Search by category
      if (transaction.category.toLowerCase().includes(lowerQuery)) {
        matches.push({
          transaction,
          matchField: 'category',
          matchText: transaction.category,
        });
        return;
      }

      // Search by description
      if (transaction.description.toLowerCase().includes(lowerQuery)) {
        matches.push({
          transaction,
          matchField: 'description',
          matchText: transaction.description,
        });
        return;
      }

      // Search by amount
      if (transaction.amount.toString().includes(lowerQuery)) {
        matches.push({
          transaction,
          matchField: 'amount',
          matchText: transaction.amount.toString(),
        });
        return;
      }

      // Search by date
      if (transaction.date.includes(lowerQuery)) {
        matches.push({
          transaction,
          matchField: 'date',
          matchText: transaction.date,
        });
      }
    });

    return matches.slice(0, 20); // Limit to 20 results
  }, [query, transactions]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    results,
    isOpen,
    open,
    close,
  };
}
