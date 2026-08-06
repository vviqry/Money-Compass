import Dexie, { type EntityTable } from 'dexie';
import type { Transaction, Settings } from '@/types';

// ─── Database Schema ─────────────────────────────────────────────────

const db = new Dexie('CashFlowDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  settings: EntityTable<Settings & { id: string }, 'id'>;
};

db.version(1).stores({
  transactions: 'id, date, category, type, amount, createdAt',
  settings: 'id',
});

// ─── Transaction Operations ──────────────────────────────────────────

export async function addTransaction(transaction: Transaction): Promise<string> {
  return db.transactions.add(transaction);
}

export async function updateTransaction(id: string, changes: Partial<Transaction>): Promise<number> {
  return db.transactions.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export async function deleteTransaction(id: string): Promise<void> {
  return db.transactions.delete(id);
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  return db.transactions.get(id);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy('date').reverse().toArray();
}

export async function getTransactionsByType(type: 'income' | 'expense'): Promise<Transaction[]> {
  return db.transactions.where('type').equals(type).reverse().sortBy('date');
}

export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  return db.transactions.where('date').equals(date).toArray();
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  return db.transactions
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getTransactionsByCategory(category: string): Promise<Transaction[]> {
  return db.transactions.where('category').equals(category).reverse().sortBy('date');
}

export async function searchTransactions(query: string): Promise<Transaction[]> {
  const lowerQuery = query.toLowerCase();
  const all = await db.transactions.toArray();
  return all.filter(
    (t) =>
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      t.amount.toString().includes(lowerQuery) ||
      t.date.includes(lowerQuery)
  );
}

export async function clearAllTransactions(): Promise<void> {
  return db.transactions.clear();
}

// ─── Settings Operations ─────────────────────────────────────────────

const SETTINGS_ID = 'app-settings';

export async function getSettings(): Promise<(Settings & { id: string }) | undefined> {
  return db.settings.get(SETTINGS_ID);
}

export async function saveSettings(settings: Settings): Promise<string> {
  return db.settings.put({ ...settings, id: SETTINGS_ID, updatedAt: new Date().toISOString() });
}

// ─── Bulk Operations (for Import/Restore) ────────────────────────────

export async function bulkAddTransactions(transactions: Transaction[]): Promise<void> {
  await db.transactions.bulkAdd(transactions);
}

export async function replaceAllData(transactions: Transaction[], settings: Settings): Promise<void> {
  await db.transaction('rw', db.transactions, db.settings, async () => {
    await db.transactions.clear();
    await db.transactions.bulkAdd(transactions);
    await db.settings.put({ ...settings, id: SETTINGS_ID });
  });
}

// ─── Export entire DB ────────────────────────────────────────────────

export async function exportAllData() {
  const transactions = await getAllTransactions();
  const settings = await getSettings();
  return { transactions, settings };
}

export { db };
