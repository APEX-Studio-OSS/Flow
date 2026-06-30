'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { useApp } from '@/components/providers/app-provider';
import { useMemo } from 'react';
import { WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { calculateBudgetStats } from '@/lib/budget-calculations';

interface BudgetOverviewProps {
  viewDate?: Date;
}

export function BudgetOverview({ viewDate = new Date() }: BudgetOverviewProps) {
  const { currency, expenses, budgets, categories } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  
  const { monthlyData, currentMonthName, isCurrentMonth } = useMemo(() => {
    const now = viewDate;
    const today = new Date();
    const isCurrentMonth = now.getFullYear() === today.getFullYear() && now.getMonth() === today.getMonth();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthName = now.toLocaleString('default', { month: 'long' });

    const stats = calculateBudgetStats(expenses, categories, budgets, monthKey);

    const data = stats.categoryStats.map(c => ({
      category: c.categoryName,
      limit: c.limit,
      month: monthKey,
      categoryName: c.categoryName,
      categoryIcon: c.categoryIcon,
      categoryColor: c.categoryColor,
      spent: c.spent,
      count: c.count,
      percentage: c.percentage,
    }));

    return { monthlyData: data, currentMonthName, isCurrentMonth };
  }, [expenses, categories, budgets, viewDate]);

  const hasBudgets = useMemo(() => monthlyData.some(b => b.limit > 0), [monthlyData]);

  const activeBudgets = useMemo(() => {
    // 1. Filter to budgeted categories (limit > 0)
    const candidates = monthlyData.filter(b => b.limit > 0);
    
    // 2. Sort by:
    //   - spent amount descending
    //   - transaction count descending
    //   - stable name order (alphabetical)
    candidates.sort((a, b) => {
      if (b.spent !== a.spent) {
        return b.spent - a.spent;
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.categoryName.localeCompare(b.categoryName);
    });

    // 3. Slice to top 6
    return candidates.slice(0, 6);
  }, [monthlyData]);

  // Motion variants for budget-empty-suggestion prompt
  const budgetPromptContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      }
    }
  };

  const budgetPromptItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const budgetPromptIconPulseVariants = {
    initial: { scale: 1, opacity: 0.95 },
    animate: {
      scale: shouldReduceMotion ? 1 : [1, 1.04, 1],
      opacity: [0.95, 1, 0.95],
      transition: {
        duration: 3,
        repeat: 3, // Pulse a few times to get attention, then stop
        repeatType: 'reverse' as const,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-bold text-foreground">
            {currentMonthName}'s Budget
          </CardTitle>
          <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.replace('/budgets')}
              className="h-12 w-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
              aria-label="Open budget"
            >
              <WalletCards className="h-5 w-5" />
            </Button>
          </motion.div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {!hasBudgets ? (
            isCurrentMonth ? (
              <motion.div
                variants={budgetPromptContainerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center py-4 text-center space-y-4"
              >
                

                {/* Minimal Animated Budget Placeholder Rows */}
                <motion.div 
                  variants={budgetPromptItemVariants}
                  className="w-full max-w-[190px] space-y-2 py-1.5"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground/45">
                      <div className="h-1.5 w-6 bg-muted/70 rounded-full" />
                      <div className="h-1.5 w-10 bg-muted/70 rounded-full" />
                    </div>
                    <div className="relative h-1 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full bg-primary/35 rounded-full"
                        style={{ transformOrigin: "left", originX: 0 }}
                        initial={!shouldReduceMotion ? { scaleX: 0 } : { scaleX: 0.35 }}
                        animate={{ scaleX: 0.35 }}
                        transition={!shouldReduceMotion ? { duration: 0.5, delay: 0.15, ease: "easeOut" } : { duration: 0 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground/45">
                      <div className="h-1.5 w-8 bg-muted/70 rounded-full" />
                      <div className="h-1.5 w-6 bg-muted/70 rounded-full" />
                    </div>
                    <div className="relative h-1 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full bg-primary/35 rounded-full"
                        style={{ transformOrigin: "left", originX: 0 }}
                        initial={!shouldReduceMotion ? { scaleX: 0 } : { scaleX: 0.6 }}
                        animate={{ scaleX: 0.6 }}
                        transition={!shouldReduceMotion ? { duration: 0.6, delay: 0.25, ease: "easeOut" } : { duration: 0 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground/45">
                      <div className="h-1.5 w-5 bg-muted/70 rounded-full" />
                      <div className="h-1.5 w-8 bg-muted/70 rounded-full" />
                    </div>
                    <div className="relative h-1 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full bg-primary/35 rounded-full"
                        style={{ transformOrigin: "left", originX: 0 }}
                        initial={!shouldReduceMotion ? { scaleX: 0 } : { scaleX: 0.2 }}
                        animate={{ scaleX: 0.2 }}
                        transition={!shouldReduceMotion ? { duration: 0.4, delay: 0.35, ease: "easeOut" } : { duration: 0 }}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={budgetPromptItemVariants} className="pt-0.5">
                  <Button 
                    onClick={() => router.replace('/budgets')} 
                    className="rounded-xl h-10 px-5 text-xs font-semibold shadow-sm active:scale-95 active:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                  >
                    Set budget
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={!shouldReduceMotion ? { opacity: 0, y: 4 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col items-center justify-center py-10 text-center space-y-3"
              >
                <div className="p-2.5 bg-muted/30 text-muted-foreground/50 rounded-xl">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">No report data</p>
                  <p className="text-xs text-muted-foreground">
                    Nothing to summarize for this month.
                  </p>
                </div>
              </motion.div>
            )
          ) : (
            <div className="space-y-4">
              {activeBudgets.map((budget) => {
                if (!budget.categoryName) return null;
                
                const isOverLimit = budget.spent > budget.limit;
                const isNearLimit = !isOverLimit && budget.limit > 0 && (budget.spent / budget.limit) >= 0.9;
                const indicatorColor = budget.categoryColor;

                return (
                  <div key={budget.category} className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-xl flex-shrink-0" style={{ backgroundColor: `${budget.categoryColor}15` }}>
                          <CategoryIcon name={budget.categoryIcon} style={{color: budget.categoryColor}} className="h-4 w-4" />
                        </div>
                        <span className="font-semibold truncate text-foreground">{budget.categoryName}</span>
                      </div>
                      <span className="font-medium flex-shrink-0 text-muted-foreground">
                        <span className={cn(
                          "font-semibold",
                          isOverLimit ? "text-destructive" : (isNearLimit ? "text-amber-500" : "text-foreground")
                        )}>
                          {formatCurrency(budget.spent, currency)}
                        </span>
                        {" "}/ {formatCurrency(budget.limit, currency)}
                      </span>
                    </div>
                    <Progress 
                      value={budget.percentage} 
                      style={{backgroundColor: `${budget.categoryColor}20`}} 
                      indicatorStyle={{backgroundColor: indicatorColor}} 
                      className="h-1.5 animate-pulse-subtle"
                      aria-label={`${budget.categoryName} budget usage progress`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
