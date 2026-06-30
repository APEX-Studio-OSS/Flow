'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn, isHistoricalMonth } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Pencil, 
  Trash2, 
  WalletCards, 
  Info, 
  ShieldAlert, 
  CheckCircle2, 
  MoreHorizontal,
  CalendarRange 
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BudgetDialog } from '@/features/budgets/budget-dialog';
import { AddCategoryDialog } from '@/features/settings/add-category-dialog';
import { EditCategoryDialog } from '@/features/settings/edit-category-dialog';
import { DeleteCategoryDialog } from '@/features/settings/delete-category-dialog';
import { FlowAlert } from '@/components/flow-popups/flow-alert';
import { OverlayStack } from '@/lib/overlay-stack';
import type { Category } from '@/types/domain';
import { calculateBudgetStats } from '@/lib/budget-calculations';

type PendingBudgetDeletion =
  | { kind: 'reassign-and-delete'; categoryId: string; categoryName: string; monthKey: string; expenseCount: number }
  | { kind: 'remove-limit'; categoryId: string; categoryName: string; monthKey: string }
  | { kind: 'blocked-other-budget'; categoryId: string; categoryName: string; monthKey: string };

interface CategoryRowData {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limit: number;
  spent: number;
  percentage: number;
  hasAllocation: boolean;
}

type BudgetEditorState = {
  category: Category;
  open: boolean;
} | null;

export default function BudgetsPage() {
  const { budgets, categories, expenses, currency, updateBudget, deleteCategory, setExpenses, setBudgets, deleteBudgetAllocationForMonth, reassignExpensesAndTransferBudget } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [viewDate, setViewDate] = useState(new Date());
  const [budgetOperationError, setBudgetOperationError] = useState<string | null>(null);
  
  // Dialog States
  const [budgetEditor, setBudgetEditor] = useState<BudgetEditorState>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingBudgetDeletion | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [openMenuCategory, setOpenMenuCategory] = useState<string | null>(null);

  const handleMenuToggle = (categoryName: string) => {
    setOpenMenuCategory(prev => prev === categoryName ? null : categoryName);
  };

  const handleEditBudget = (categoryName: string, limit: number) => {
    const cat = categories.find(c => c.name === categoryName);
    if (cat) {
      setBudgetEditor({ category: cat, open: true });
    }
    setOpenMenuCategory(null);
  };

  // Current Real Month
  const currentRealMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const viewMonthKey = useMemo(() => {
    return `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
  }, [viewDate]);

  const isCurrentMonthView = viewMonthKey === currentRealMonthKey;

  const changeMonth = (amount: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  // Close any open row menu when changing viewMonthKey
  useEffect(() => {
    setOpenMenuCategory(null);
  }, [viewMonthKey]);

  // Handle outside clicks and window scrolling to close active row options
  useEffect(() => {
    if (!openMenuCategory) return;

    const handleOutsideClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (!target.ownerDocument?.contains(target)) {
        return;
      }
      if (!target.closest('.row-actions-container')) {
        setOpenMenuCategory(null);
      }
    };

    const handleScroll = () => {
      setOpenMenuCategory(null);
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('pointerdown', handleOutsideClick);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('pointerdown', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [openMenuCategory]);

  // Back button integration with OverlayStack
  useEffect(() => {
    if (openMenuCategory) {
      const overlayId = `budget-row-actions-${openMenuCategory}`;
      OverlayStack.register(overlayId, () => setOpenMenuCategory(null), 1, undefined, false);
      return () => {
        OverlayStack.unregister(overlayId);
      };
    }
  }, [openMenuCategory]);

  // Single-pass data consolidation O(N)
  const monthData = useMemo(() => {
    const stats = calculateBudgetStats(expenses, categories, budgets, viewMonthKey);
    
    let catSpending = stats.categoryStats.map(c => ({
      id: c.id,
      category: c.categoryName,
      categoryName: c.categoryName,
      categoryIcon: c.categoryIcon,
      categoryColor: c.categoryColor,
      limit: c.limit,
      spent: c.spent,
      percentage: c.percentage,
      hasAllocation: c.hasAllocation
    }));

    if (!isCurrentMonthView) {
      catSpending = catSpending.filter(row => row.spent > 0);
    }

    const sorted = [...catSpending].sort((a, b) => {
      // 1. Keep "Other" at the bottom
      if (a.categoryName === 'Other') return 1;
      if (b.categoryName === 'Other') return -1;

      if (isCurrentMonthView) {
        // 2. Sort allocated categories above unallocated categories
        if (a.hasAllocation && !b.hasAllocation) return -1;
        if (!a.hasAllocation && b.hasAllocation) return 1;

        // 3. Sort allocated categories by spent amount descending
        if (a.hasAllocation && b.hasAllocation) {
          return b.spent - a.spent;
        }

        // 4. Sort unallocated categories alphabetically by name
        return a.categoryName.localeCompare(b.categoryName);
      } else {
        // Sort by spent descending
        return b.spent - a.spent;
      }
    });

    return {
      categorySpending: sorted,
      totalSpent: stats.monthlySpent,
      totalBudget: stats.totalBudget
    };
  }, [viewMonthKey, budgets, expenses, categories, isCurrentMonthView]);

  const initiateDeleteBudget = (categoryId: string, categoryName: string) => {
    if (!categoryId || !categoryName || !viewMonthKey) {
      console.error('Unable to remove limit. Required data is missing.');
      return;
    }

    setBudgetOperationError(null);

    const stats = calculateBudgetStats(expenses, categories, budgets, viewMonthKey);
    const catStat = stats.categoryStats.find(c => {
      const catName = c.categoryName.trim().toLowerCase();
      const targetName = categoryName.trim().toLowerCase();
      return catName === targetName;
    });
    const expenseCount = catStat ? catStat.count : 0;

    if (categoryName === 'Other') {
      if (expenseCount > 0) {
        setPendingDeletion({
          kind: 'blocked-other-budget',
          categoryId,
          categoryName,
          monthKey: viewMonthKey,
        });
        setIsAlertOpen(true);
        setOpenMenuCategory(null);
        return;
      }
    }

    if (expenseCount > 0) {
      setPendingDeletion({
        kind: 'reassign-and-delete',
        categoryId,
        categoryName,
        monthKey: viewMonthKey,
        expenseCount,
      });
    } else {
      setPendingDeletion({
        kind: 'remove-limit',
        categoryId,
        categoryName,
        monthKey: viewMonthKey,
      });
    }
    setIsAlertOpen(true);
    setOpenMenuCategory(null);
  };

  const handleDeleteBudgetConfirm = async () => {
    if (!pendingDeletion || isSubmitting) return;
    setIsSubmitting(true);
    setBudgetOperationError(null);

    try {
      if (pendingDeletion.kind === 'blocked-other-budget') {
        setIsAlertOpen(false);
        return;
      }

      if (pendingDeletion.kind === 'reassign-and-delete') {
        await reassignExpensesAndTransferBudget(pendingDeletion.categoryName, pendingDeletion.monthKey);
      } else {
        await deleteBudgetAllocationForMonth(pendingDeletion.categoryName, pendingDeletion.monthKey);
      }
      
      setIsAlertOpen(false);
    } catch (err: any) {
      setBudgetOperationError(err.message || 'An error occurred during deletion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertExitComplete = () => {
    setPendingDeletion(null);
    setBudgetOperationError(null);
  };

  const handleDeleteCategory = (targetCategoryName: string) => {
    if (!categoryToDelete) return;
    deleteCategory(categoryToDelete.id, targetCategoryName);
    setCategoryToDelete(null);
  };

  const totalBudget = typeof monthData.totalBudget === 'number' && !isNaN(monthData.totalBudget) ? monthData.totalBudget : 0;
  const totalSpent = typeof monthData.totalSpent === 'number' && !isNaN(monthData.totalSpent) ? monthData.totalSpent : 0;

  const remainingBudget = totalBudget - totalSpent;
  const isOverBudget = totalBudget > 0 && totalSpent > totalBudget;
  const isNearBudgetLimit = totalBudget > 0 && !isOverBudget && (totalSpent / totalBudget) > 0.7;
  const budgetUsagePercent = totalBudget > 0 
    ? (totalSpent / totalBudget) * 100 
    : (totalSpent > 0 ? 100 : 0);

  // Status indicators for the header summary
  let statusText = "No budget set";
  let statusColorClass = "text-muted-foreground bg-muted/40 border-muted-foreground/10";
  let statusIcon = <Info className="h-3 w-3" />;

  if (totalBudget > 0) {
    if (isOverBudget) {
      statusText = "Over budget";
      statusColorClass = "text-destructive bg-destructive/10 border-destructive/20";
      statusIcon = <ShieldAlert className="h-3 w-3" />;
    } else if (isNearBudgetLimit) {
      statusText = "Close to limit";
      statusColorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
      statusIcon = <ShieldAlert className="h-3 w-3" />;
    } else {
      statusText = "On track";
      statusColorClass = "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      statusIcon = <CheckCircle2 className="h-3 w-3" />;
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 140, damping: 18 }
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 pb-[calc(2.5rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))] max-w-4xl flex flex-col min-h-full space-y-5">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col flex-1 min-h-0 space-y-5"
      >
        {/* Header Section */}
        <motion.header variants={itemVariants} className="flex flex-row items-center justify-between gap-4 select-none">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Budget & Categories
            </h1>
            <p className="text-xs text-muted-foreground">
              {isCurrentMonthView 
                ? "Manage your monthly spending limits." 
                : "Historical archive of monthly spending."}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Month Selector */}
            <div className="flex items-center gap-0.5 bg-muted/40 border border-border/30 p-1 rounded-xl">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => changeMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground min-w-[76px] text-center tabular-nums">
                {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => changeMonth(1)}
                disabled={isCurrentMonthView}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Simple Month Summary Card */}
        <motion.div variants={itemVariants}>
          {!mounted ? (
            <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden animate-pulse">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center select-none">
                  <div className="h-4 w-28 bg-muted rounded-md" />
                  <div className="h-4.5 w-16 bg-muted rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4 border-y border-border/20 py-3.5 select-none">
                  <div className="space-y-1.5">
                    <div className="h-3 w-10 bg-muted rounded" />
                    <div className="h-5 w-16 bg-muted rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-5 w-12 bg-muted rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-14 bg-muted rounded" />
                    <div className="h-5 w-14 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center select-none">
                  <span className="text-xs font-bold text-foreground">Monthly Summary</span>
                  <span className={cn("flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase select-none", statusColorClass)}>
                    {statusIcon}
                    {statusText}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 border-y border-border/20 py-3.5 select-none">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground/80 tracking-wider">Spent</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">
                      {formatCurrency(totalSpent, currency)}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground/80 tracking-wider">Budget Limit</p>
                    <p className="text-lg font-bold text-foreground/90 tabular-nums">
                      {totalBudget > 0 ? formatCurrency(totalBudget, currency) : "—"}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground/80 tracking-wider">
                      {totalBudget > 0 ? (isOverBudget ? "Over By" : "Remaining") : "Balance"}
                    </p>
                    <p className={cn(
                      "text-lg font-extrabold tabular-nums",
                      totalBudget === 0 
                        ? "text-muted-foreground/90" 
                        : isOverBudget 
                          ? "text-destructive" 
                          : "text-emerald-500 dark:text-emerald-400"
                    )}>
                      {totalBudget > 0 ? formatCurrency(Math.abs(remainingBudget), currency) : "—"}
                    </p>
                  </div>
                </div>

                {/* Summary progress bar */}
                {totalBudget > 0 && (
                  <div className="space-y-1.5 select-none">
                    <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                      <span>{budgetUsagePercent.toFixed(0)}% consumed</span>
                    </div>
                    <Progress 
                      value={budgetUsagePercent}
                      className="h-1.5 bg-muted/65 rounded-full"
                      indicatorStyle={{ 
                        backgroundColor: isOverBudget 
                          ? 'hsl(var(--destructive))' 
                          : (isNearBudgetLimit ? '#F59E0B' : 'hsl(var(--primary))') 
                      }}
                      aria-label="Monthly budget usage progress"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Categories Section Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center select-none pt-1">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Category Spending
          </h2>
          {isCurrentMonthView && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsAddCategoryOpen(true)}
              className="h-10 w-10 rounded-xl border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center justify-center shadow-sm"
              aria-label="Create Category"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </motion.div>

        {/* Categories Progress list */}
        <motion.div variants={itemVariants} className="flex-1 min-h-0">
          {monthData.categorySpending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {monthData.categorySpending.map((item) => {
                if (!item.hasAllocation) {
                  return (
                    <div 
                      key={item.category} 
                      className="p-3 border border-border/20 rounded-2xl bg-card/15 dark:bg-card/5 hover:bg-card/25 transition-all duration-200 flex flex-col gap-2.5 shadow-sm opacity-70 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="h-8.5 w-8.5 rounded-xl flex items-center justify-center flex-shrink-0" 
                            style={{ backgroundColor: `${item.categoryColor}10` }}
                          >
                            <CategoryIcon name={item.categoryIcon} style={{ color: item.categoryColor }} className="h-4 w-4 opacity-75" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-foreground/80 truncate">{item.categoryName}</span>
                            <span className="text-[10px] text-muted-foreground/75 font-medium">
                              {isCurrentMonthView ? "No budget set" : `Spent: ${formatCurrency(item.spent, currency)}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 row-actions-container relative z-10">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={openMenuCategory === item.category ? 'actions' : 'info'}
                              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
                              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1.5 pointer-events-auto"
                            >
                              {openMenuCategory === item.category ? (
                                <>
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="icon" 
                                    className="h-11 w-11 rounded-xl pointer-events-auto relative z-10" 
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onClick={(e) => { 
                                      e.stopPropagation();
                                      handleEditBudget(item.categoryName, 0); 
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Set Limit</span>
                                  </Button>
                                  {item.categoryName !== 'Other' && (
                                    <Button 
                                      type="button"
                                      variant="destructive" 
                                      size="icon" 
                                      className="h-11 w-11 rounded-xl pointer-events-auto relative z-10" 
                                      onPointerDown={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      onClick={(e) => { 
                                        e.stopPropagation();
                                        setCategoryToDelete({
                                          id: item.id,
                                          name: item.categoryName,
                                          icon: item.categoryIcon,
                                          color: item.categoryColor
                                        }); 
                                        setOpenMenuCategory(null); 
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete Category</span>
                                    </Button>
                                  )}
                                </>
                              ) : (
                                !isCurrentMonthView && (
                                  <div className="text-right mr-1 select-none">
                                    <p className="text-[9px] font-semibold text-muted-foreground/60">
                                      No budget set
                                    </p>
                                  </div>
                                )
                              )}
                            </motion.div>
                          </AnimatePresence>

                          {isCurrentMonthView && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-11 w-11 flex-shrink-0 rounded-full hover:bg-muted/65 pointer-events-auto relative z-10" 
                              onPointerDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuToggle(item.category);
                              }}
                              aria-label={`${item.categoryName} options`}
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                const isRowOver = item.limit > 0 && item.spent > item.limit;
                const isRowNear = item.limit > 0 && !isRowOver && (item.spent / item.limit) >= 0.7;
                const rowRemaining = item.limit - item.spent;
                const progressColor = item.categoryColor;

                return (
                  <div 
                    key={item.category} 
                    className="p-3 border border-border/30 rounded-2xl bg-card/40 hover:bg-card/60 transition-all duration-200 flex flex-col gap-2.5 shadow-sm animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="h-8.5 w-8.5 rounded-xl flex items-center justify-center flex-shrink-0" 
                          style={{ backgroundColor: `${item.categoryColor}15` }}
                        >
                          <CategoryIcon name={item.categoryIcon} style={{ color: item.categoryColor }} className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-foreground truncate">{item.categoryName}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Spent: {formatCurrency(item.spent, currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 row-actions-container relative z-10">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={openMenuCategory === item.category ? 'actions' : 'info'}
                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1.5 pointer-events-auto"
                          >
                            {openMenuCategory === item.category ? (
                              <>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="icon" 
                                  className="h-11 w-11 rounded-xl pointer-events-auto relative z-10" 
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    handleEditBudget(item.categoryName, item.limit); 
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit Limit</span>
                                </Button>
                                <Button 
                                  type="button"
                                  variant="destructive" 
                                  size="icon" 
                                  className="h-11 w-11 rounded-xl pointer-events-auto relative z-10" 
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    initiateDeleteBudget(item.id, item.categoryName);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove Limit</span>
                                </Button>
                              </>
                            ) : (
                              <div className={cn("text-right", isCurrentMonthView ? "mr-1" : "")}>
                                <p className="text-[10px] font-bold text-foreground">
                                  Limit: {formatCurrency(item.limit, currency)}
                                </p>
                                <p className={cn(
                                  "text-[9px] font-semibold select-none",
                                  isRowOver ? "text-destructive font-bold" : (isRowNear ? "text-amber-500 font-bold" : "text-muted-foreground/80")
                                )}>
                                  {isRowOver 
                                    ? `${formatCurrency(Math.abs(rowRemaining), currency)} over`
                                    : `${formatCurrency(rowRemaining, currency)} left`
                                  }
                                </p>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>

                        {isCurrentMonthView && (
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-11 w-11 flex-shrink-0 rounded-full hover:bg-muted/65 pointer-events-auto relative z-10" 
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuToggle(item.category);
                            }}
                            aria-label={`${item.categoryName} options`}
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Progress 
                      value={item.percentage} 
                      style={{ backgroundColor: `${item.categoryColor}15` }}
                      indicatorStyle={{ backgroundColor: progressColor }}
                      className="h-1"
                      aria-label={`${item.categoryName} progress bar`}
                      aria-valuetext={
                        item.limit > 0 && item.spent > item.limit
                          ? `${formatCurrency(item.spent, currency)} spent of ${formatCurrency(item.limit, currency)} limit`
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border border-dashed border-border/50 rounded-3xl p-5 bg-muted/5 select-none">
              <div className="p-3 bg-muted/40 rounded-xl text-muted-foreground">
                <WalletCards className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">
                {isCurrentMonthView 
                  ? "No category budgets allocated for this month" 
                  : "No spending recorded for this month."}
              </p>
              <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed mb-2">
                {isCurrentMonthView 
                  ? "You must allocate budgets for categories to display spending progress."
                  : "There are no transactions recorded in this period."}
              </p>
            </div>
          )}
        </motion.div>

        {/* Read-only helper banner for history at bottom */}
        {!isCurrentMonthView && (
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground bg-muted/15 border border-border/20 px-3.5 py-2 rounded-xl select-none max-w-sm mx-auto mb-2"
          >
            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground/75 flex-shrink-0" />
            <span>This archive period is read-only. Edit options are active for the current month.</span>
          </motion.div>
        )}
      </motion.div>

      {/* dialogs */}
      <BudgetDialog
        open={budgetEditor !== null && budgetEditor.open}
        onOpenChange={(open) => {
          if (!open) {
            setBudgetEditor(prev => prev ? { ...prev, open: false } : null);
          }
        }}
        onExitComplete={() => {
          setBudgetEditor(null);
        }}
        month={viewMonthKey}
        categoryName={budgetEditor?.category.name || ''}
        initialLimit={budgetEditor ? (budgets.find(b => b.category === budgetEditor.category.name && b.month === viewMonthKey)?.limit ?? 0) : 0}
      />

      {/* 3. Add Category Details Dialog */}
      <AddCategoryDialog 
        open={isAddCategoryOpen} 
        onOpenChange={setIsAddCategoryOpen} 
      />

      {/* 4. Edit Category Details Dialog */}
      <AnimatePresence>
        {categoryToEdit && (
          <EditCategoryDialog
            category={categoryToEdit}
            month={viewMonthKey}
            onOpenChange={(open) => !open && setCategoryToEdit(null)}
          />
        )}
      </AnimatePresence>

      {/* 5. Delete Category Dialog */}
      <AnimatePresence>
        {categoryToDelete && (
          <DeleteCategoryDialog
            category={categoryToDelete}
            onDelete={handleDeleteCategory}
            onCancel={() => setCategoryToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* 6. Delete Budget Limit Confirmation */}
      <FlowAlert
        open={isAlertOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setIsAlertOpen(open);
          }
        }}
        title={
          pendingDeletion?.kind === 'blocked-other-budget'
            ? "Cannot Remove Budget Limit"
            : pendingDeletion?.kind === 'reassign-and-delete'
            ? "Delete Budget Allocation?"
            : "Remove Budget Limit?"
        }
        description={
          (pendingDeletion?.kind === 'blocked-other-budget'
            ? "This month contains expenses assigned to Other. The Other budget allocation cannot be removed while it has active transactions."
            : pendingDeletion?.kind === 'reassign-and-delete'
            ? `This category has ${pendingDeletion.expenseCount} expense(s) this month. Deleting the budget will move those expenses to Other.`
            : `Are you sure you want to delete the budget allocation for ${pendingDeletion?.categoryName ?? ''} this month?`) +
          (budgetOperationError ? `\n\nError: ${budgetOperationError}` : '')
        }
        confirmText={
          pendingDeletion?.kind === 'blocked-other-budget'
            ? "Close"
            : pendingDeletion?.kind === 'reassign-and-delete'
            ? "Reassign & Delete"
            : "Delete Budget"
        }
        cancelText="Cancel"
        onConfirm={handleDeleteBudgetConfirm}
        variant={
          pendingDeletion?.kind === 'blocked-other-budget'
            ? "warning"
            : pendingDeletion?.kind === 'reassign-and-delete'
            ? "destructive"
            : undefined
        }
        showCancel={pendingDeletion?.kind !== 'blocked-other-budget'}
        onExitComplete={handleAlertExitComplete}
        closeDisabled={isSubmitting}
        isSubmitting={isSubmitting}
      />


    </div>
  );
}
