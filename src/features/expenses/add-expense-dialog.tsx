'use client';

import { useState, useRef, lazy, Suspense, useEffect, useCallback, useMemo } from 'react';
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
import { CalendarIcon, Plus } from 'lucide-react';
import { PaymentMethodSelector } from './payment-method-selector';
import { getCurrencySymbol, formatDate, getExpenseCategoryOptionsForMonth, getExpenseMonth } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';
import { CategoryIcon } from '@/components/icons/category-icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import type { Category } from '@/types/domain';

const AddNoteDialog = lazy(() => import('@/features/notes/add-note-dialog').then(module => ({ default: module.AddNoteDialog })));

const expenseSchema = z.object({
  description: z.string().min(1, 'Enter a description.'),
  amount: z.coerce.number({ invalid_type_error: 'Enter an amount.' }).positive('Amount must be greater than zero.'),
  category: z.string().min(1, 'Choose a category.'),
  date: z.date({ required_error: 'Choose a valid date.' }),
  isOnline: z.boolean(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function AddExpenseDialog({
  showFloatingButton = true,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  openMode = 'button',
}: {
  showFloatingButton?: boolean;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openMode?: 'button' | 'nativeAction' | 'direct';
} = {}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setLocalOpen;
  
  const [noteOpen, setNoteOpen] = useState(false);
  const { currency, addExpense, categories, budgets, experimentalSettings } = useApp();
  const { isNotesEnabled } = experimentalSettings;
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      category: '',
      date: new Date(),
      isOnline: false,
    },
  });

  const watchedDate = form.watch('date');
  
  const expenseMonthKey = useMemo(() => {
    return getExpenseMonth(watchedDate || new Date());
  }, [watchedDate]);

  const allocatedCategories = useMemo(() => {
    return getExpenseCategoryOptionsForMonth(categories, budgets, expenseMonthKey);
  }, [categories, budgets, expenseMonthKey]);

  const currentCategory = form.watch('category');

  const prevMonthRef = useRef(expenseMonthKey);

  // Check initial category validity on open
  useEffect(() => {
    if (open && currentCategory) {
      const isValid = allocatedCategories.some((c: Category) => c.name === currentCategory);
      if (!isValid) {
        form.setValue('category', '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle month/date change resets
  useEffect(() => {
    if (open) {
      if (expenseMonthKey !== prevMonthRef.current) {
        const wasCategorySelected = !!currentCategory;
        const isValidInNewMonth = allocatedCategories.some((c: Category) => c.name === currentCategory);
        if (wasCategorySelected && !isValidInNewMonth) {
          form.setValue('category', '');
        }
        prevMonthRef.current = expenseMonthKey;
      }
    }
  }, [expenseMonthKey, currentCategory, allocatedCategories, form, open]);

  // Focus on mount when dialog opens
  useEffect(() => {
    if (open) {
      const focusTimer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(focusTimer);
    }
  }, [open]);

  const handlePointerDown = () => {
    if (!isNotesEnabled) return;
    pressTimer.current = setTimeout(() => {
      setNoteOpen(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  
  const handleClick = () => {
    if (!noteOpen) {
       setOpen(true);
    }
  };

  const onSubmit = (data: ExpenseFormValues) => {
    addExpense(data);
    setOpen(false);
  };

  return (
    <>
      {trigger ? (
        <div 
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="inline-block"
        >
          {trigger}
        </div>
      ) : showFloatingButton ? (
        <div className="fixed bottom-[calc(var(--safe-area-bottom)+16px)] right-[calc(var(--safe-area-right)+16px)] sm:bottom-8 sm:right-8 z-[35]">
          <Button
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-300 group active:scale-[0.93] focus:ring-2 focus:ring-primary focus:ring-offset-2"
            size="icon"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleClick}
            aria-label="Add Expense or Note"
          >
            <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
          </Button>
        </div>
      ) : null}

      <BottomFloatingForm
        open={open}
        onClose={() => { setOpen(false); form.reset(); }}
        title="Add Expense"
        description="Track a new spending entry"
        visuallyHiddenHeader={true}
        footer={
          <Button 
            type="submit" 
            form="add-expense-form"
            disabled={allocatedCategories.length === 0 || !currentCategory || !allocatedCategories.some((c: Category) => c.name === currentCategory)} 
            className="w-full rounded-xl h-12 text-sm font-semibold transition-all duration-200 active:scale-[0.98]" 
            size="lg"
          >
            Save Expense
          </Button>
        }
      >
        <Form {...form}>
          <form id="add-expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-0.5">
            {/* Amount input */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-2xl border border-dashed border-border px-4 relative overflow-hidden group hover:bg-muted/30 transition-all duration-300">
                      <span className="sr-only">
                        Amount
                      </span>
                      <div className="relative flex items-center justify-center w-full max-w-[200px]">
                        <span className="text-xl font-bold text-muted-foreground mr-1.5 select-none">
                          {getCurrencySymbol(currency)}
                        </span>
                        <Input 
                          type="number" 
                          inputMode="decimal" 
                          step="any" 
                          placeholder="0.00" 
                          ref={amountInputRef}
                          className="text-2xl h-8 font-extrabold text-center bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted-foreground/30 text-foreground" 
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          aria-label="Amount"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-center font-semibold text-destructive mt-1" />
                </FormItem>
              )}
            />

            {/* Description input */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What did you buy?" 
                      className="h-11 rounded-xl bg-background/50 border-input focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 text-sm font-medium"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
                </FormItem>
              )}
            />

            {/* Category selection chips */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <div className="flex items-center justify-between min-h-[18px]">
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Category</FormLabel>
                    {field.value && (
                      <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 select-none">
                        {field.value}
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <div>
                      {allocatedCategories.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-thin scrollbar-thumb-muted -mx-6 px-6">
                          {allocatedCategories.map((cat: Category) => {
                            const isSelected = field.value === cat.name;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => field.onChange(cat.name)}
                                style={{
                                  borderColor: isSelected ? cat.color : 'transparent',
                                  backgroundColor: isSelected ? `${cat.color}15` : 'hsl(var(--muted)/40%)',
                                }}
                                className={cn(
                                  "flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all flex-shrink-0 active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0",
                                  isSelected ? "shadow-sm" : "hover:bg-muted/70 border-border/10"
                                )}
                              >
                                <CategoryIcon name={cat.icon} style={{ color: cat.color }} className="h-5 w-5" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-3 px-3 text-center rounded-2xl border border-dashed border-destructive/20 bg-destructive/5 text-destructive select-none flex flex-col items-center gap-0.5">
                          <p className="text-xs font-bold">No categories are budgeted for this month</p>
                          <p className="text-[10px] text-destructive/80 font-medium">Add a budget to enable expense tracking.</p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
                </FormItem>
              )}
            />

            <Separator className="opacity-40" />

            {/* Date and Channel Side-by-Side */}
            <div className="flex items-center gap-3">
              {/* Online Toggle (Payment Method) */}
              <FormField
                control={form.control}
                name="isOnline"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1 flex-shrink-0">
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Payment Method</FormLabel>
                    <PaymentMethodSelector value={field.value} onChange={field.onChange} />
                    <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
                  </FormItem>
                )}
              />

              {/* Date Selector */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1 flex-1">
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            type="button"
                            className={cn(
                              "w-full pl-3 text-left font-medium h-10 rounded-xl bg-background/50 border-input focus:ring-2 focus:ring-primary text-xs",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-lg border bg-card" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </BottomFloatingForm>

      {isNotesEnabled && (
        <Suspense fallback={<div></div>}>
            <AddNoteDialog open={noteOpen} onOpenChange={setNoteOpen} />
        </Suspense>
      )}
    </>
  );
}
