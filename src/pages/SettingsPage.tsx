import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CURRENCY_OPTIONS, DEFAULT_EXPENSE_CATEGORIES } from '@/lib/constants';
import { exportAsJSON, exportAsCSV, parseImportFile } from '@/lib/export';
import type { ThemeMode } from '@/types';
import {
  Moon,
  Sun,
  Monitor,
  Upload,
  Shield,
  AlertTriangle,
  Palette,
  Coins,
  Database,
  FileJson,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

export default function SettingsPage() {
  const { settings, updateSettings, transactions, replaceAllAppData } = useApp();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeChange = (theme: ThemeMode) => {
    updateSettings({ theme });
  };

  const handleCurrencyChange = (currency: string) => {
    const option = CURRENCY_OPTIONS.find((c) => c.code === currency);
    if (option) {
      updateSettings({
        currency: option.code,
        currencySymbol: option.symbol,
        locale: option.locale,
      });
    }
  };

  const handleHighRiskToggle = (categoryName: string) => {
    const current = settings.highRiskCategories;
    const updated = current.includes(categoryName)
      ? current.filter((c) => c !== categoryName)
      : [...current, categoryName];
    updateSettings({ highRiskCategories: updated });
  };

  const handleExportJSON = () => {
    exportAsJSON(transactions, settings);
  };

  const handleExportCSV = () => {
    exportAsCSV(transactions);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseImportFile(file);
      await replaceAllAppData(data.transactions, data.settings);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-2xl"
    >
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Appearance */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Palette className="w-4 h-4 text-violet-500" />
          Appearance
        </div>
        <div className="flex gap-3">
          {[
            { value: 'light' as ThemeMode, icon: Sun, label: 'Light' },
            { value: 'dark' as ThemeMode, icon: Moon, label: 'Dark' },
            { value: 'system' as ThemeMode, icon: Monitor, label: 'System' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all',
                settings.theme === option.value
                  ? 'border-violet-500 bg-violet-500/5'
                  : 'border-border hover:border-foreground/20'
              )}
            >
              <option.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Currency */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Coins className="w-4 h-4 text-emerald-500" />
          Currency
        </div>
        <Select value={settings.currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.code} value={opt.code}>
                {opt.symbol} — {opt.name} ({opt.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* High Risk Categories */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Shield className="w-4 h-4 text-amber-500" />
          High Risk Categories
        </div>
        <p className="text-xs text-muted-foreground">
          Transactions in high-risk categories will trigger the Financial Investigation Mode,
          helping you reflect before impulse purchases.
        </p>
        <div className="space-y-3">
          {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{cat.name}</span>
                {settings.highRiskCategories.includes(cat.name) && (
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                    High Risk
                  </Badge>
                )}
              </div>
              <Switch
                checked={settings.highRiskCategories.includes(cat.name)}
                onCheckedChange={() => handleHighRiskToggle(cat.name)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-2xl bg-card/50 border border-border/50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Database className="w-4 h-4 text-blue-500" />
          Data Management
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleExportJSON}
            className="rounded-xl h-auto py-4 flex-col gap-2"
          >
            <FileJson className="w-5 h-5 text-blue-500" />
            <span className="text-xs">Export JSON</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-xl h-auto py-4 flex-col gap-2"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span className="text-xs">Export CSV</span>
          </Button>
        </div>

        <Separator />

        <div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-full rounded-xl h-auto py-4 flex-col gap-2',
              importStatus === 'success' && 'border-emerald-500 text-emerald-600',
              importStatus === 'error' && 'border-red-500 text-red-500'
            )}
          >
            {importStatus === 'success' ? (
              <>
                <Check className="w-5 h-5" />
                <span className="text-xs">Import Successful!</span>
              </>
            ) : importStatus === 'error' ? (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span className="text-xs">Import Failed</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-violet-500" />
                <span className="text-xs">Import / Restore Backup</span>
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Import a JSON backup file. This will replace all current data.
          </p>
        </div>
      </motion.div>

      {/* App Info */}
      <div className="text-center text-xs text-muted-foreground pb-8">
        <p>CashFlow v1.0.0</p>
        <p>Financial Behavior System</p>
      </div>
    </motion.div>
  );
}
