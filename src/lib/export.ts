import type { Transaction, ExportData } from '@/types';
import type { Settings } from '@/types';
import { APP_VERSION } from '@/lib/constants';

// ─── Export as JSON ──────────────────────────────────────────────────

export function exportAsJSON(transactions: Transaction[], settings: Settings): void {
  const data: ExportData = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions,
    settings,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `cashflow-backup-${formatFileDate()}.json`);
}

// ─── Export as CSV ───────────────────────────────────────────────────

export function exportAsCSV(transactions: Transaction[]): void {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Created At'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    t.amount.toString(),
    `"${t.description.replace(/"/g, '""')}"`,
    t.createdAt,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `cashflow-transactions-${formatFileDate()}.csv`);
}

// ─── Import Data ─────────────────────────────────────────────────────

export async function parseImportFile(file: File): Promise<ExportData> {
  const text = await file.text();

  if (file.name.endsWith('.json')) {
    const data = JSON.parse(text);
    validateImportData(data);
    return data as ExportData;
  }

  throw new Error('Unsupported file format. Please use a JSON file.');
}

function validateImportData(data: unknown): asserts data is ExportData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file format');
  }

  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.transactions)) {
    throw new Error('Missing or invalid transactions data');
  }

  // Validate each transaction has required fields
  for (const t of d.transactions) {
    if (typeof t !== 'object' || !t) throw new Error('Invalid transaction entry');
    const tx = t as Record<string, unknown>;
    if (!tx.id || !tx.amount || !tx.date || !tx.type || !tx.category) {
      throw new Error('Transaction is missing required fields');
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatFileDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
