import type { Category, GateConfig } from '@/types';

// ─── Income Categories ──────────────────────────────────────────────

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc-shopee-seller', name: 'Shopee Seller', type: 'income', icon: 'ShoppingBag', isHighRisk: false, isCustom: false, color: '#f97316' },
  { id: 'inc-shopee-affiliate', name: 'Shopee Affiliate', type: 'income', icon: 'Link', isHighRisk: false, isCustom: false, color: '#ef4444' },
  { id: 'inc-happy-snack', name: 'Happy Snack House', type: 'income', icon: 'Cookie', isHighRisk: false, isCustom: false, color: '#eab308' },
  { id: 'inc-gift', name: 'Gift', type: 'income', icon: 'Gift', isHighRisk: false, isCustom: false, color: '#ec4899' },
  { id: 'inc-freelance', name: 'Freelance', type: 'income', icon: 'Laptop', isHighRisk: false, isCustom: false, color: '#8b5cf6' },
  { id: 'inc-sell-used', name: 'Sell Used Items', type: 'income', icon: 'Recycle', isHighRisk: false, isCustom: false, color: '#14b8a6' },
  { id: 'inc-other', name: 'Other', type: 'income', icon: 'MoreHorizontal', isHighRisk: false, isCustom: false, color: '#6b7280' },
];

// ─── Expense Categories ─────────────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp-food', name: 'Food', type: 'expense', icon: 'UtensilsCrossed', isHighRisk: false, isCustom: false, color: '#f97316' },
  { id: 'exp-coffee', name: 'Coffee', type: 'expense', icon: 'Coffee', isHighRisk: false, isCustom: false, color: '#92400e' },
  { id: 'exp-snack', name: 'Snack', type: 'expense', icon: 'Candy', isHighRisk: false, isCustom: false, color: '#ec4899' },
  { id: 'exp-electricity', name: 'Electricity', type: 'expense', icon: 'Zap', isHighRisk: false, isCustom: false, color: '#eab308' },
  { id: 'exp-wifi', name: 'Wifi', type: 'expense', icon: 'Wifi', isHighRisk: false, isCustom: false, color: '#3b82f6' },
  { id: 'exp-internet', name: 'Internet', type: 'expense', icon: 'Globe', isHighRisk: false, isCustom: false, color: '#06b6d4' },
  { id: 'exp-transport', name: 'Transportation', type: 'expense', icon: 'Car', isHighRisk: false, isCustom: false, color: '#6366f1' },
  { id: 'exp-business', name: 'Business Capital', type: 'expense', icon: 'Briefcase', isHighRisk: false, isCustom: false, color: '#0d9488' },
  { id: 'exp-digital', name: 'Digital Product', type: 'expense', icon: 'Monitor', isHighRisk: true, isCustom: false, color: '#dc2626' },
  { id: 'exp-donation', name: 'Donation', type: 'expense', icon: 'Heart', isHighRisk: false, isCustom: false, color: '#e11d48' },
  { id: 'exp-hutang', name: 'Hutang', type: 'expense', icon: 'HandCoins', isHighRisk: false, isCustom: false, color: '#f43f5e' },
  { id: 'exp-other', name: 'Other', type: 'expense', icon: 'MoreHorizontal', isHighRisk: false, isCustom: false, color: '#6b7280' },
];

// ─── All Default Categories ─────────────────────────────────────────

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

// ─── Default High Risk Categories ───────────────────────────────────

export const DEFAULT_HIGH_RISK_CATEGORIES = ['Digital Product'];

// ─── Investigation Gate Configs ─────────────────────────────────────

export const INVESTIGATION_GATES: GateConfig[] = [
  {
    id: 1,
    title: 'Gate 1 of 8',
    question: 'What exactly are you buying?',
    inputType: 'text',
    placeholder: 'Describe the product or service...',
  },
  {
    id: 2,
    title: 'Gate 2 of 8',
    question: 'What specific financial result do you expect?',
    inputType: 'text',
    placeholder: 'e.g., "I expect to earn $500/month from this skill"',
  },
  {
    id: 3,
    title: 'Gate 3 of 8',
    question: 'Name three digital products you have purchased but haven\'t finished.',
    inputType: 'textarea',
    placeholder: '1. ...\n2. ...\n3. ...',
  },
  {
    id: 4,
    title: 'Gate 4 of 8',
    question: 'Approximately what percentage of your previous digital purchases actually generated money?',
    inputType: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
  {
    id: 5,
    title: 'Gate 5 of 8',
    question: 'What will happen if you DON\'T buy this today?',
    inputType: 'text',
    placeholder: 'Be honest with yourself...',
  },
  {
    id: 6,
    title: 'Gate 6 of 8',
    question: 'Have you completed your previous project?',
    inputType: 'boolean',
  },
  {
    id: 7,
    title: 'Gate 7 of 8',
    question: 'Does this product teach something truly new?',
    inputType: 'boolean-explain',
    placeholder: 'Explain what makes this different...',
  },
  {
    id: 8,
    title: 'Gate 8 of 8',
    question: 'What can this product do that your previous products cannot?',
    inputType: 'textarea',
    placeholder: 'Describe the unique value...',
  },
];

// ─── Inspirational Quotes ───────────────────────────────────────────

export const COOLING_QUOTES = [
  'Great financial decisions are often made after emotions settle.',
  'The best investment you can make is in yourself — but only if you follow through.',
  'Wealth is not about having a lot of money — it\'s about having options.',
  'Every dollar you save is a dollar working for your future self.',
  'Pause. Reflect. Decide. The best choices are rarely rushed.',
  'Financial freedom is a marathon, not a sprint.',
  'The money you don\'t spend today becomes the freedom you have tomorrow.',
  'Discipline is choosing between what you want now and what you want most.',
  'A moment of patience can prevent a year of regret.',
  'Your future self will thank you for this pause.',
];

// ─── Currency Options ───────────────────────────────────────────────

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },
];

// ─── Default Settings ───────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  currency: 'IDR',
  currencySymbol: 'Rp',
  locale: 'id-ID',
  theme: 'dark' as const,
  highRiskCategories: DEFAULT_HIGH_RISK_CATEGORIES,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── App Metadata ───────────────────────────────────────────────────

export const APP_NAME = 'CashFlow';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Financial Behavior System — Understand why your money disappears.';
