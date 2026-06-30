'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomFloatingForm } from '@/components/flow-popups/bottom-floating-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/components/providers/app-provider';
import { getCurrencySymbol, cn, isHistoricalMonth, formatCurrency } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { useMemo, useEffect } from 'react';
import { calculateBudgetStats } from '@/lib/budget-calculations';

const budgetSchema = z.object({
  limit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ invalid_type_error: 'Enter a budget amount.' }).min(0, 'Limit must be zero or positive.')
  ),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetLimitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  categoryName: string;
  initialLimit: number;
  onExitComplete?: () => void;
}

export function BudgetLimitSheet({ open, onOpenChange, month, categoryName, initialLimit, onExitComplete }: BudgetLimitSheetProps) {
  const { updateBudget, categories, expenses, currency, budgets } = useApp();

  const isHistory = isHistoricalMonth(month);

  const hasAllocation = useMemo(() => {
    return budgets.some(b => b.category === categoryName && b.month === month);
  }, [budgets, categoryName, month]);

  const selectedCategoryDetails = useMemo(() => {
    return categories.find(c => c.name === categoryName);
  }, [categories, categoryName]);

  // Calculate current month's spent for this specific category
  const categorySpent = useMemo(() => {
    const stats = calculateBudgetStats(expenses, categories, budgets, month);
    const catStat = stats.categoryStats.find(c => {
      const catName = c.categoryName.trim().toLowerCase();
      const targetName = categoryName.trim().toLowerCase();
      return catName === targetName;
    });
    return catStat ? catStat.spent : 0;
  }, [expenses, categories, budgets, categoryName, month]);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    mode: 'onChange',
    defaultValues: {
      limit: initialLimit,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        limit: initialLimit,
      });
    }
  }, [open, initialLimit, form]);

  const onSubmit = (data: BudgetFormValues) => {
    if (isHistory) {
      return;
    }
    updateBudget(categoryName, data.limit, month);
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  const limitValue = form.watch('limit') || 0;
  const remainingValue = limitValue - categorySpent;
  const isOverBudget = limitValue > 0 && categorySpent > limitValue;

  const formattedMonth = useMemo(() => {
    try {
      return new Date(month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' });
    } catch {
      return month;
    }
  }, [month]);

  return (
    <BottomFloatingForm
      open={open}
      onClose={() => handleOpenChange(false)}
      title={hasAllocation ? "Edit Budget" : "Set Budget"}
      description={hasAllocation ? "Update this month’s limit." : "Set this month’s limit."}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onExitComplete={onExitComplete}
      footer={
        <div className="flex flex-row gap-2 w-full select-none">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            className="flex-1 rounded-xl h-11 text-xs font-bold border-input"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="budget-limit-form"
            disabled={isHistory || !form.formState.isValid}
            className="flex-1 rounded-xl h-11 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
          >
            Save Budget
          </Button>
        </div>
      }
    >
      {/* Read-only Category row + month chip */}
      <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border/40 rounded-2xl select-none mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {selectedCategoryDetails && (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${selectedCategoryDetails.color}15` }}>
              <CategoryIcon name={selectedCategoryDetails.icon} style={{ color: selectedCategoryDetails.color }} className="h-4.5 w-4.5" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-extrabold text-foreground truncate leading-normal">{categoryName}</span>
            <span className="text-[10px] text-muted-foreground font-semibold leading-normal">Category</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {formattedMonth}
          </span>
          {isHistory && (
            <span className="text-[9px] font-extrabold text-destructive border border-destructive/20 bg-destructive/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Read Only
            </span>
          )}
        </div>
      </div>

      <Form {...form}>
        <form id="budget-limit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <FormField
            control={form.control}
            name="limit"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly limit</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground select-none">
                      {getCurrencySymbol(currency)}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="0.00"
                      disabled={isHistory}
                      className="pl-8 h-10 rounded-xl bg-background/50 border-input focus-visible:ring-2 focus-visible:ring-primary text-sm font-semibold text-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
              </FormItem>
            )}
          />

          {/* Spending context stats row */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-muted/15 border border-border/20 rounded-2xl select-none text-xs font-medium">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Spent</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(categorySpent, currency)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Limit</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(limitValue, currency)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">
                {isOverBudget ? "Over By" : "Remaining"}
              </span>
              <span className={cn(
                "text-sm font-extrabold tabular-nums",
                isOverBudget ? "text-destructive" : "text-emerald-500"
              )}>
                {formatCurrency(Math.abs(remainingValue), currency)}
              </span>
            </div>
          </div>
        </form>
      </Form>
    </BottomFloatingForm>
  );
}
