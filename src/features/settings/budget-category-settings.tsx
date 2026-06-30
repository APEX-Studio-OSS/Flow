'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManageBudgets } from './manage-budgets';
import { Button } from '@/components/ui/button';
import { Plus, Search, WalletCards } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { AddCategoryDialog } from './add-category-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';
import { CategoryIcon } from '@/components/icons/category-icon';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { calculateBudgetStats } from '@/lib/budget-calculations';

interface BudgetCategorySettingsProps {
    className?: string;
    viewDate: Date;
}

export function BudgetCategorySettings({ className, viewDate }: BudgetCategorySettingsProps) {
  const { budgets, categories, expenses, currency, isLoaded } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [view, setView] = useState<'progress' | 'manage'>('progress');
  const [hasInitializedView, setHasInitializedView] = useState(false);

  const viewMonthKey = useMemo(() => `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`, [viewDate]);

  // Dynamically initialize tab focus based on database content
  useEffect(() => {
    if (isLoaded && !hasInitializedView) {
      const hasCategories = categories.length > 0;
      const hasExpenses = expenses.length > 0;
      setView((hasCategories && hasExpenses) ? 'progress' : 'manage');
      setHasInitializedView(true);
    }
  }, [isLoaded, categories.length, expenses.length, hasInitializedView]);

  // Single pass calculation of category spending, fully memoized
  const { categorySpending } = useMemo(() => {
    const stats = calculateBudgetStats(expenses, categories, budgets, viewMonthKey);

    const data = stats.categoryStats
      .filter(item => item.spent > 0)
      .map(item => ({
        category: item.categoryName,
        categoryName: item.categoryName,
        categoryIcon: item.categoryIcon,
        categoryColor: item.categoryColor,
        limit: item.limit,
        spent: item.spent,
        percentage: item.percentage
      }))
      .sort((a, b) => b.spent - a.spent);

    return { categorySpending: data };
  }, [viewMonthKey, budgets, categories, expenses]);

  return (
    <>
      <Card className={cn("w-full flex flex-col overflow-hidden", className)}>
        <CardHeader className="pb-3 pt-5 px-5 space-y-3.5 select-none">
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <CardTitle className="text-sm font-bold text-foreground">Categories</CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground truncate leading-normal">
                Track category spending or manage your categories.
              </CardDescription>
            </div>
            {view === 'manage' && (
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-xl h-8 text-[11px] font-semibold gap-1.5 flex-shrink-0 active:scale-98 transition-transform" 
                onClick={() => setIsAddCategoryOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </Button>
            )}
          </div>

          {/* Segmented Toggle Control */}
          <div className="flex bg-muted/40 p-0.5 rounded-2xl border border-border/10">
            <button
              type="button"
              onClick={() => setView('progress')}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0",
                view === 'progress' 
                  ? "bg-card text-foreground shadow-sm border border-border/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
              )}
            >
              Progress
            </button>
            <button
              type="button"
              onClick={() => setView('manage')}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0",
                view === 'manage' 
                  ? "bg-card text-foreground shadow-sm border border-border/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
              )}
            >
              Manage
            </button>
          </div>

          {/* Search box only shown on Manage tab */}
          {view === 'manage' && (
            <div className="relative mt-0.5 animate-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-muted/20 border-0 focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/60"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 pt-0 px-5 pb-5">
          <ScrollArea className="h-[380px] pr-3 -mr-3">
            <AnimatePresence mode="wait">
              {view === 'progress' ? (
                <motion.div
                  key="progress-view"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3 pt-0.5"
                >
                  {categorySpending.length > 0 ? (
                    categorySpending.map((item) => {
                      const isOver = item.limit > 0 && item.spent > item.limit;
                      const isNear = item.limit > 0 && !isOver && (item.spent / item.limit) >= 0.7;
                      const left = item.limit - item.spent;
                      const progressColor = item.categoryColor;

                      return (
                        <div 
                          key={item.category} 
                          className="p-3.5 border border-border/30 rounded-2xl bg-card/40 hover:bg-card/60 transition-all duration-200 flex flex-col gap-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div 
                                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" 
                                style={{ backgroundColor: `${item.categoryColor}15` }}
                              >
                                <CategoryIcon name={item.categoryIcon} style={{ color: item.categoryColor }} className="h-4.5 w-4.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm text-foreground truncate">{item.categoryName}</span>
                                <span className="text-[10px] text-muted-foreground/85">
                                  {formatCurrency(item.spent, currency)} spent
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {item.limit > 0 ? (
                                <>
                                  <p className="text-xs font-bold text-foreground">
                                    Limit: {formatCurrency(item.limit, currency)}
                                  </p>
                                  <p className={cn(
                                    "text-[10px] font-medium mt-0.5",
                                    isOver ? "text-destructive font-bold" : (isNear ? "text-amber-500 font-bold" : "text-muted-foreground/80")
                                  )}>
                                    {isOver 
                                      ? `${formatCurrency(Math.abs(left), currency)} over`
                                      : `${formatCurrency(left, currency)} left`
                                    }
                                  </p>
                                </>
                              ) : (
                                <p className="text-[10px] font-medium text-muted-foreground">
                                  No limit set
                                </p>
                              )}
                            </div>
                          </div>

                          {item.limit > 0 && (
                            <Progress 
                              value={item.percentage} 
                              style={{ backgroundColor: `${item.categoryColor}20` }}
                              indicatorStyle={{ backgroundColor: progressColor }}
                              className="h-1.5"
                              aria-label={`${item.categoryName} spending progress`}
                            />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 select-none">
                      <div className="p-3 bg-muted/30 rounded-xl text-muted-foreground">
                        <WalletCards className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">No category spending yet</p>
                      <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed">
                        Expenses recorded in this month will display progress here.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="manage-view"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="pt-0.5"
                >
                  <ManageBudgets viewDate={viewDate} searchQuery={searchQuery} />
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
      <AddCategoryDialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen} />
    </>
  );
}

