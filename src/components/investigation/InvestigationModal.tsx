import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { INVESTIGATION_GATES, COOLING_QUOTES } from '@/lib/constants';
import { useInvestigation } from '@/hooks/useInvestigation';
import { useDigitalProductStats } from '@/hooks/useStatistics';
import { useApp } from '@/store/AppContext';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import type { InvestigationData } from '@/types';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Brain,
  Clock,
  TrendingDown,
  Wallet,
  Target,
  BarChart3,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestigationModalProps {
  open: boolean;
  onComplete: (data: InvestigationData) => void;
  onCancel: () => void;
  pendingAmount: number;
  pendingCategory: string;
}

export function InvestigationModal({
  open,
  onComplete,
  onCancel,
  pendingAmount,
  pendingCategory,
}: InvestigationModalProps) {
  const investigation = useInvestigation();
  const digitalStats = useDigitalProductStats();
  const { settings } = useApp();

  // Local state for current gate answer
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [booleanAnswer, setBooleanAnswer] = useState<boolean | null>(null);
  const [explanation, setExplanation] = useState('');
  const [coolingSeconds, setCoolingSeconds] = useState(60);
  const [coolingDone, setCoolingDone] = useState(false);
  const [phase, setPhase] = useState<'gates' | 'history' | 'cooling'>('gates');
  const [currentGate, setCurrentGate] = useState(1);

  const gate = INVESTIGATION_GATES[currentGate - 1];
  const progress = (currentGate / INVESTIGATION_GATES.length) * 100;

  const handleSubmitGate = () => {
    let answer: unknown;

    switch (gate.inputType) {
      case 'text':
      case 'textarea':
        if (!currentAnswer.trim()) return;
        answer = currentAnswer;
        break;
      case 'number':
        answer = parseInt(currentAnswer) || 0;
        break;
      case 'boolean':
        if (booleanAnswer === null) return;
        answer = booleanAnswer;
        break;
      case 'boolean-explain':
        if (booleanAnswer === null || !explanation.trim()) return;
        answer = { value: booleanAnswer, explanation };
        break;
    }

    investigation.submitGateAnswer(currentGate, answer);

    if (currentGate >= INVESTIGATION_GATES.length) {
      setPhase('history');
    } else {
      setCurrentGate(currentGate + 1);
    }

    // Reset inputs
    setCurrentAnswer('');
    setBooleanAnswer(null);
    setExplanation('');
  };

  const startCooling = () => {
    setPhase('cooling');
    setCoolingSeconds(60);
    setCoolingDone(false);

    const interval = setInterval(() => {
      setCoolingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCoolingDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFinalSave = () => {
    const data = investigation.getInvestigationData();
    onComplete(data);
    // Reset everything
    setPhase('gates');
    setCurrentGate(1);
    setCoolingDone(false);
    investigation.reset();
  };

  const randomQuote = COOLING_QUOTES[Math.floor(Math.random() * COOLING_QUOTES.length)];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-0 rounded-3xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Financial Investigation</h2>
              <p className="text-xs text-muted-foreground">
                High-risk category detected: {pendingCategory}
              </p>
            </div>
          </div>
          {phase === 'gates' && (
            <Progress value={progress} className="h-1.5 rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {/* PHASE: GATES */}
            {phase === 'gates' && gate && (
              <motion.div
                key={`gate-${currentGate}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Brain className="w-3.5 h-3.5" />
                  {gate.title}
                </div>

                <h3 className="text-xl font-semibold text-foreground leading-relaxed">
                  {gate.question}
                </h3>

                {/* Input based on type */}
                {(gate.inputType === 'text') && (
                  <Input
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={gate.placeholder}
                    className="rounded-xl"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitGate()}
                  />
                )}

                {gate.inputType === 'textarea' && (
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={gate.placeholder}
                    className="rounded-xl resize-none"
                    rows={4}
                    autoFocus
                  />
                )}

                {gate.inputType === 'number' && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder={gate.placeholder}
                      className="rounded-xl text-2xl font-bold text-center"
                      autoFocus
                    />
                    <p className="text-center text-sm text-muted-foreground">percent (%)</p>
                  </div>
                )}

                {gate.inputType === 'boolean' && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setBooleanAnswer(true)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-medium',
                        booleanAnswer === true
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-border hover:border-foreground/20'
                      )}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setBooleanAnswer(false)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-medium',
                        booleanAnswer === false
                          ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'border-border hover:border-foreground/20'
                      )}
                    >
                      <XCircle className="w-5 h-5" />
                      No
                    </button>
                  </div>
                )}

                {gate.inputType === 'boolean-explain' && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setBooleanAnswer(true)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium',
                          booleanAnswer === true
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                            : 'border-border hover:border-foreground/20'
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setBooleanAnswer(false)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium',
                          booleanAnswer === false
                            ? 'border-red-500 bg-red-500/10 text-red-600'
                            : 'border-border hover:border-foreground/20'
                        )}
                      >
                        No
                      </button>
                    </div>
                    <Textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder={gate.placeholder}
                      className="rounded-xl resize-none"
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={handleSubmitGate}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* PHASE: HISTORY */}
            {phase === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-foreground">Your Digital Product History</h3>
                <p className="text-sm text-muted-foreground">
                  Here's a reflection of your past purchases. No judgment — just awareness.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <StatItem
                    icon={<ShoppingCart className="w-4 h-4" />}
                    label="Total Purchased"
                    value={digitalStats.totalPurchased.toString()}
                  />
                  <StatItem
                    icon={<Wallet className="w-4 h-4" />}
                    label="Total Spent"
                    value={formatCurrency(digitalStats.totalSpent, settings.currency, settings.locale)}
                  />
                  <StatItem
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Completed"
                    value={digitalStats.completedCourses.toString()}
                  />
                  <StatItem
                    icon={<Target className="w-4 h-4" />}
                    label="Completion Rate"
                    value={formatPercentage(digitalStats.completionRate)}
                  />
                  <StatItem
                    icon={<BarChart3 className="w-4 h-4" />}
                    label="Est. ROI"
                    value={formatPercentage(digitalStats.estimatedROI)}
                  />
                  <StatItem
                    icon={<TrendingDown className="w-4 h-4" />}
                    label="Largest Purchase"
                    value={formatCurrency(digitalStats.largestPurchase, settings.currency, settings.locale)}
                  />
                  <div className="col-span-2">
                    <StatItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Monthly Average"
                      value={formatCurrency(digitalStats.monthlyAverage, settings.currency, settings.locale)}
                    />
                  </div>
                </div>

                <Button
                  onClick={startCooling}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                >
                  I understand. Continue.
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* PHASE: COOLING TIMER */}
            {phase === 'cooling' && (
              <motion.div
                key="cooling"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 py-4"
              >
                {/* Countdown */}
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36">
                    {/* Background circle */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        className="text-muted/30"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="url(#coolGradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={339.292}
                        animate={{ strokeDashoffset: 339.292 * (1 - coolingSeconds / 60) }}
                        transition={{ duration: 0.5 }}
                      />
                      <defs>
                        <linearGradient id="coolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        key={coolingSeconds}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-foreground"
                      >
                        {coolingSeconds}
                      </motion.span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
                    <Clock className="w-4 h-4" />
                    Cooling period
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-center text-sm italic text-muted-foreground px-4">
                  "{randomQuote}"
                </blockquote>

                {/* Financial context */}
                <div className="space-y-2 bg-muted/50 rounded-2xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Savings</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(digitalStats.currentSavings, settings.currency, settings.locale)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Spending</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(digitalStats.monthlySpending, settings.currency, settings.locale)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Purchase</span>
                    <span className="font-medium text-red-500">
                      -{formatCurrency(pendingAmount, settings.currency, settings.locale)}
                    </span>
                  </div>
                  <div className="border-t border-border/50 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Potential Remaining</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(
                          digitalStats.currentSavings - pendingAmount,
                          settings.currency,
                          settings.locale
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <AnimatePresence>
                  {coolingDone ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="space-y-2"
                    >
                      <Button
                        onClick={handleFinalSave}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                      >
                        Save Transaction
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          onCancel();
                          setPhase('gates');
                          setCurrentGate(1);
                          investigation.reset();
                        }}
                        className="w-full rounded-xl text-muted-foreground"
                      >
                        Cancel — I changed my mind
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground">
                      Save button will appear after the cooling period
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  );
}
