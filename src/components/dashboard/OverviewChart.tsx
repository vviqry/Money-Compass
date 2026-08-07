import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useOverviewChartData, type OverviewTab } from '@/hooks/useOverviewChart';
import { cn } from '@/lib/utils';

const TABS: { value: OverviewTab; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const STORAGE_KEY = 'money-compass:overview-chart-tab';

function getInitialTab(): OverviewTab {
  if (typeof window === 'undefined') return 'monthly';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'daily' || saved === 'weekly' || saved === 'monthly' || saved === 'yearly') {
    return saved;
  }
  return 'monthly';
}

export function OverviewChart() {
  const [tab, setTab] = useState<OverviewTab>(getInitialTab);
  const data = useOverviewChartData(tab);

  const handleTabChange = (value: OverviewTab) => {
    setTab(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  };

  // Skip every other tick on dense axes so labels don't collide.
  const tickInterval = tab === 'daily' ? 2 : tab === 'monthly' ? 2 : 0;

  return (
    <div className="rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm font-medium text-muted-foreground">Overview</h3>

        {/* Segmented tab control with a sliding indicator */}
        <div className="relative flex items-center gap-1 p-1 rounded-xl bg-muted">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTabChange(t.value)}
              className={cn(
                'relative z-10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                tab === t.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === t.value && (
                <motion.span
                  layoutId="overview-tab-indicator"
                  className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 md:h-56">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                  minTickGap={8}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                  isAnimationActive
                  animationDuration={500}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                  isAnimationActive
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
