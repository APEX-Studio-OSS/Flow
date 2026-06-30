'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Calendar, WalletCards, ArrowRight, Plus } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { BudgetOverview } from '@/features/budgets/budget-overview';
import { RecentExpenses } from '@/features/expenses/recent-expenses';
import { AddExpenseDialog } from '@/features/expenses/add-expense-dialog';
import { useApp } from '@/components/providers/app-provider';
import { Progress } from '@/components/ui/progress';
import { cardMotion, pillMotion } from '@/lib/motion-presets';
import { calculateBudgetStats } from '@/lib/budget-calculations';

const RECENT_EXPENSE_LIMIT = 8;

let dashboardHasAnimated = false;

export default function DashboardPage() {
  const { currency, expenses, budgets, categories, isMotionReady } = useApp();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [hasAnimated, setHasAnimated] = useState(dashboardHasAnimated);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [addExpenseMode, setAddExpenseMode] = useState<'button' | 'nativeAction'>('button');
  const [isAtBottom, setIsAtBottom] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMotionReady && !hasAnimated) {
      dashboardHasAnimated = true;
      setHasAnimated(true);
    }
  }, [isMotionReady, hasAnimated]);

  useEffect(() => {
    if (searchParams && searchParams.get('action') === 'add-expense') {
      setAddExpenseMode('nativeAction');
      setIsAddExpenseOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      const newQuery = params.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
    }
  }, [searchParams, pathname, router]);

  const hasMoreExpenses = expenses.length > RECENT_EXPENSE_LIMIT;
  const shouldShowViewAll = isAtBottom && hasMoreExpenses;

  useEffect(() => {
    if (!isMotionReady) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      {
        root: document.querySelector('.app-main-scroll'),
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [isMotionReady]);

  const handlePillClick = () => {
    if (shouldShowViewAll) {
      router.replace('/expenses');
    } else {
      setIsAddExpenseOpen(true);
    }
  };

  const { todaysSpend, thisMonthSpend, totalBudget, currentMonthName } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthName = now.toLocaleString('default', { month: 'long' });

    let todaysSpend = 0;

    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      const d = e.date; // date is already a Date object in context state

      if (d >= today) {
        todaysSpend += e.amount;
      }
    }
      
    const stats = calculateBudgetStats(expenses, categories, budgets, monthKey);

    return { todaysSpend, thisMonthSpend: stats.monthlySpent, totalBudget: stats.totalBudget, currentMonthName };
  }, [expenses, categories, budgets]);

  const remainingBudget = totalBudget - thisMonthSpend;
  const isOverBudget = remainingBudget < 0;

  const budgetUsagePercent = totalBudget > 0 
    ? (thisMonthSpend / totalBudget) * 100 
    : (thisMonthSpend > 0 ? 100 : 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      }
    }
  };

  const itemVariants = cardMotion(shouldReduceMotion);
  const pillVariants = pillMotion(shouldReduceMotion);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl pt-4 sm:pt-6 pb-[calc(var(--safe-area-bottom)+7.5rem)] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))]">
      <motion.div
        variants={containerVariants}
        initial={hasAnimated ? "visible" : "hidden"}
        animate={isMotionReady ? "visible" : "hidden"}
        className="grid grid-cols-1 gap-5"
      >
        {/* Main Hero Summary Card */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-none text-primary-foreground bg-gradient-to-br from-primary via-primary/95 to-accent/90 shadow-xl shadow-primary/15 rounded-3xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
            <CardContent className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary-foreground/75 font-semibold">
                  {currentMonthName} Spending
                </p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {formatCurrency(thisMonthSpend, currency)}
                  </h2>
                  {totalBudget > 0 && (
                    <span className="text-xs text-primary-foreground/70 font-medium bg-white/15 px-2 py-0.5 rounded-full">
                      {budgetUsagePercent.toFixed(0)}% used
                    </span>
                  )}
                </div>
              </div>

              {totalBudget > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-primary-foreground/80 font-medium">
                    <span>Monthly Limit: {formatCurrency(totalBudget, currency)}</span>
                    <span>
                      {isOverBudget 
                        ? `${formatCurrency(Math.abs(remainingBudget), currency)} over`
                        : `${formatCurrency(remainingBudget, currency)} left`
                      }
                    </span>
                  </div>
                  <Progress 
                    value={budgetUsagePercent} 
                    className="h-2 bg-white/20" 
                    indicatorStyle={{ backgroundColor: 'white' }}
                    aria-label="Monthly budget usage progress"
                  />
                </div>
              ) : (
                <div className="text-xs text-primary-foreground/75 border-t border-white/10 pt-4 flex items-center gap-2">
                  <WalletCards className="h-4 w-4 text-white/80" />
                  No budget limit set for this month. Configure budgets to track limits.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Secondary Metrics Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
                Today
              </span>
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground truncate">
                {formatCurrency(todaysSpend, currency)}
              </p>
            </div>
          </Card>

          <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
                Remaining
              </span>
              <div className={cn(
                "p-2 rounded-xl",
                isOverBudget 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              )}>
                {isOverBudget ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </div>
            </div>
            <div>
              <p className={cn(
                "text-2xl font-bold tracking-tight truncate",
                isOverBudget ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
              )}>
                {formatCurrency(remainingBudget, currency)}
              </p>
            </div>
          </Card>
        </motion.div>
        
        {/* Budget overview & Recent Transactions */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <BudgetOverview />
            <RecentExpenses />
        </motion.div>
      </motion.div>

      {/* Sentinel element to detect scroll to bottom */}
      <div ref={sentinelRef} className="h-1 w-full pointer-events-none mt-2" />

      {/* Centered Translucent Bottom Pill Button Wrapper */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-area-bottom)+16px)] z-[35] flex justify-center px-4">
        <motion.button
          onClick={handlePillClick}
          whileTap={shouldReduceMotion ? {} : { scale: 0.92, opacity: 0.9 }}
          transition={{ type: "spring", stiffness: 600, damping: 25 }}
          className="pointer-events-auto h-14 min-w-[176px] px-6 rounded-full translucent-action-pill backdrop-blur-md text-foreground flex items-center justify-center select-none shadow-lg"
          aria-label={shouldShowViewAll ? "View all expenses" : "Add expense"}
        >
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {shouldShowViewAll ? (
                <motion.div
                  key="view-all"
                  variants={pillVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex items-center justify-center gap-2 font-semibold text-sm"
                >
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>View all</span>
                </motion.div>
              ) : (
                <motion.div
                  key="add-expense"
                  variants={pillVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex items-center justify-center gap-2 font-semibold text-sm"
                >
                  <Plus className="h-4 w-4 text-primary animate-pulse" />
                  <span>Add expense</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </div>

      <AddExpenseDialog 
        open={isAddExpenseOpen}
        onOpenChange={(open: boolean) => {
          setIsAddExpenseOpen(open);
          if (!open) {
            setTimeout(() => setAddExpenseMode('button'), 300);
          }
        }}
        showFloatingButton={false}
        openMode={addExpenseMode}
      />
    </div>
  );
}
