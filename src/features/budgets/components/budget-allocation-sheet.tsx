'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlowDialog } from '@/components/flow-popups/flow-dialog';
import { FlowSelectSheet } from '@/components/flow-popups/flow-select-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/components/providers/app-provider';
import { getCurrencySymbol, cn, isHistoricalMonth } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { X, Check } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";

const budgetSchema = z.object({
  category: z.string().min(1, 'Choose a category.'),
  limit: z.coerce.number({ invalid_type_error: 'Enter a budget amount.' }).min(0, 'Limit must be zero or positive.'),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetAllocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
}

export function BudgetAllocationSheet({ open, onOpenChange, month }: BudgetAllocationSheetProps) {
  const { updateBudget, categories, budgets, currency } = useApp();

  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);

  const isHistory = isHistoricalMonth(month);

  const availableCategories = React.useMemo(() => {
    const budgetedNames = budgets
      .filter(b => b.month === month)
      .map(b => b.category);
    return categories.filter(c => !budgetedNames.includes(c.name));
  }, [categories, budgets, month]);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      limit: undefined as any,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        category: '',
        limit: undefined as any,
      });
      setIsCategoryOpen(false);
    }
  }, [open, form]);

  const onSubmit = (data: BudgetFormValues) => {
    if (isHistory) {
      return;
    }
    updateBudget(data.category, data.limit, month);
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  const selectedCategoryName = form.watch('category');
  const selectedCategoryDetails = categories.find(c => c.name === selectedCategoryName);
  const selectedLimit = form.watch('limit');

  const formattedMonth = React.useMemo(() => {
    try {
      return new Date(month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' });
    } catch {
      return month;
    }
  }, [month]);

  const isFormValid = selectedCategoryName && selectedLimit !== undefined && selectedLimit !== null && String(selectedLimit) !== '';

  if (isHistory) {
    return (
      <FlowDialog open={open} onOpenChange={handleOpenChange} className="p-6 gap-0 w-[calc(100%-32px)] max-w-[400px] rounded-[28px] select-none">
        {/* Title row with close button */}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="absolute top-4 right-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted select-none z-10"
          onClick={() => handleOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="space-y-1 pr-6">
          <h2 className="text-lg font-extrabold text-foreground leading-tight">Add Budget</h2>
          <p className="text-xs text-muted-foreground leading-normal">
            Cannot allocate budgets for historical months.
          </p>
        </div>

        <div className="mt-[18px] py-6 px-4 border border-border/30 bg-muted/20 rounded-2xl text-center">
          <p className="text-xs font-bold text-muted-foreground leading-normal">
            Budget allocations cannot be added to past months ({formattedMonth}). Please select the current month to allocate budgets.
          </p>
        </div>

        <div className="pt-[22px]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            className="w-full rounded-xl h-12 text-xs font-bold border-input"
          >
            Close
          </Button>
        </div>
      </FlowDialog>
    );
  }

  return (
    <FlowDialog open={open} onOpenChange={handleOpenChange} className="p-6 gap-0 w-[calc(100%-32px)] max-w-[400px] rounded-[28px] select-none">
      {/* Title row with close button */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="absolute top-4 right-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted select-none z-10"
        onClick={() => handleOpenChange(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-1 pr-6">
        <h2 className="text-lg font-extrabold text-foreground leading-tight">Add Budget</h2>
        <p className="text-xs text-muted-foreground leading-normal">
          Choose a category and set its monthly limit.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="pt-[18px] flex flex-col min-h-0 space-y-4">
          
          {/* Category Selector Field */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="space-y-1.5 flex flex-col">
                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</FormLabel>
                
                {/* Selector Trigger Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryOpen(true)}
                  className="h-12 rounded-xl border border-input bg-background/50 hover:bg-muted/40 flex items-center justify-between px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:rounded-xl w-full text-left font-normal"
                >
                  {selectedCategoryDetails ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" 
                        style={{ backgroundColor: `${selectedCategoryDetails.color}15` }}
                      >
                        <CategoryIcon name={selectedCategoryDetails.icon} className="h-4 w-4" style={{ color: selectedCategoryDetails.color }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate">{selectedCategoryDetails.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">Select category</span>
                  )}
                  
                  {/* Right side color dot + down chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground">
                    {selectedCategoryDetails && (
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedCategoryDetails.color }} />
                    )}
                    <svg 
                      className="h-4 w-4 opacity-50" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </Button>

                <FlowSelectSheet
                  open={isCategoryOpen}
                  onOpenChange={setIsCategoryOpen}
                  title="Select Category"
                  description={
                    availableCategories.length > 0
                      ? "Choose an available category to allocate budget."
                      : "All categories already have budgets this month."
                  }
                  value={field.value}
                  onValueChange={field.onChange}
                  options={availableCategories.map((category) => ({
                    value: category.name,
                    label: category.name,
                    icon: (
                      <div 
                        className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0" 
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <CategoryIcon name={category.icon} className="h-4 w-4" style={{ color: category.color }} />
                      </div>
                    ),
                    meta: (
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                    )
                  }))}
                  searchPlaceholder="Search category..."
                />
                <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
              </FormItem>
            )}
          />

          {/* Monthly Limit Input */}
          <FormField
            control={form.control}
            name="limit"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Limit</FormLabel>
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
                      className="pl-8 h-12 rounded-xl bg-background/50 border-input focus-visible:ring-2 focus-visible:ring-primary text-sm font-semibold text-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-[6px]">
            <Button
              type="submit"
              disabled={isHistory || availableCategories.length === 0 || !isFormValid}
              className="w-full rounded-xl h-12 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
            >
              Add Budget
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)} 
              className="w-full rounded-xl h-12 text-xs font-bold border-input"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </FlowDialog>
  );
}
