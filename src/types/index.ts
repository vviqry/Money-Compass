import { z } from 'zod';

// ─── Transaction Types ───────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  category: string;
  description: string;
  notes?: string;
  attachment?: string; // base64 encoded
  type: TransactionType;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  investigationData?: InvestigationData;
}

// ─── Category Types ──────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Lucide icon name
  isHighRisk: boolean;
  isCustom: boolean;
  color: string;
}

// ─── Investigation Types ─────────────────────────────────────────────

export interface InvestigationData {
  gate1_whatBuying: string;
  gate2_expectedResult: string;
  gate3_unfinishedProducts: string;
  gate4_percentageGenerated: number;
  gate5_ifNotBuy: string;
  gate6_completedPrevious: boolean;
  gate7_teachesNew: boolean;
  gate7_explanation: string;
  gate8_uniqueCapability: string;
  completedAt: string; // ISO datetime
  coolingTimerCompleted: boolean;
}

export interface GateConfig {
  id: number;
  title: string;
  question: string;
  inputType: 'text' | 'textarea' | 'number' | 'boolean' | 'boolean-explain';
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface DigitalProductStats {
  totalPurchased: number;
  totalSpent: number;
  completedCourses: number;
  completionRate: number;
  estimatedROI: number;
  largestPurchase: number;
  monthlyAverage: number;
}

// ─── Settings Types ──────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';

export interface Settings {
  currency: string;
  currencySymbol: string;
  locale: string;
  theme: ThemeMode;
  highRiskCategories: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Statistics Types ────────────────────────────────────────────────

export type StatsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface StatsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savings: number;
  largestExpense: { category: string; amount: number } | null;
  mostFrequentExpense: { category: string; count: number } | null;
  categoryBreakdown: CategoryStat[];
  trendData: TrendPoint[];
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  type: TransactionType;
}

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
  date: string;
}

// ─── Calendar Types ──────────────────────────────────────────────────

export interface DayData {
  date: string;
  hasIncome: boolean;
  hasExpense: boolean;
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
}

// ─── Search Types ────────────────────────────────────────────────────

export interface SearchResult {
  transaction: Transaction;
  matchField: 'category' | 'description' | 'amount' | 'date';
  matchText: string;
}

// ─── Export/Import Types ─────────────────────────────────────────────

export interface ExportData {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  settings: Settings;
}

// ─── Zod Schemas ─────────────────────────────────────────────────────

export const transactionSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .max(999999999999, 'Amount is too large'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(500, 'Too long'),
  notes: z.string().max(1000, 'Too long').optional(),
  type: z.enum(['income', 'expense']),
  attachment: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const investigationSchema = z.object({
  gate1_whatBuying: z.string().min(1, 'Please answer this question'),
  gate2_expectedResult: z.string().min(1, 'Please answer this question'),
  gate3_unfinishedProducts: z.string().min(1, 'Please answer this question'),
  gate4_percentageGenerated: z.number().min(0).max(100),
  gate5_ifNotBuy: z.string().min(1, 'Please answer this question'),
  gate6_completedPrevious: z.boolean(),
  gate7_teachesNew: z.boolean(),
  gate7_explanation: z.string().min(1, 'Please explain'),
  gate8_uniqueCapability: z.string().min(1, 'Please answer this question'),
});

export const settingsSchema = z.object({
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  locale: z.string().min(1),
  theme: z.enum(['dark', 'light', 'system']),
  highRiskCategories: z.array(z.string()),
});

// ─── Wishlist Types (Pengungkit Produktivitas & Kekayaan) ────────────

export interface WishlistItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  link: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// ─── Revenue Stream Types (Reminder & Management) ───────────────────

export type RevenueStreamCategory =
  | 'Gaji'
  | 'Affiliate'
  | 'Freelance'
  | 'Bisnis'
  | 'Investasi'
  | 'Lainnya';

export interface RevenueStream {
  id: string;
  name: string;
  category: RevenueStreamCategory;
  amount: number;
  notes: string;
  color: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
