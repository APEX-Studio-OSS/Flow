'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { ExpensesList } from '@/features/expenses/expenses-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from '@/types/domain';
import { ExpensesFilterDialog } from '@/features/expenses/expenses-filter-dialog';
import { Button } from '@/components/ui/button';
import { ListFilter, Search, X, Loader2 } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { Input } from '@/components/ui/input';
import {
  type ExpenseFilters,
  type NormalizedFilterCriteria,
  getEmptyExpenseFilters,
  normalizeExpenseFilters,
  applyExpenseFiltersSync,
  hasActiveExpenseFilters
} from '@/lib/filtering';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getCurrencySymbol } from '@/lib/utils';

export default function AllExpensesPage() {
  const startTimeRef = useRef(performance.now());
  const { expenses, currency } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Track initial load / render times
  useEffect(() => {
    const renderTime = performance.now() - startTimeRef.current;
    if (typeof window !== 'undefined' && (window as any).__flow_perf) {
      (window as any).__flow_perf.initialRenderTime = Math.round(renderTime);
      (window as any).__flow_perf.expensesCount = expenses.length;
    }
  }, [expenses.length]);

  // Lifted Filter States
  const [appliedFilters, setAppliedFilters] = useState<ExpenseFilters>(getEmptyExpenseFilters());
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const hasActiveFilters = useMemo(() => hasActiveExpenseFilters(appliedFilters), [appliedFilters]);

  // Synchronous filter computation via useMemo
  const filteredExpenses = useMemo(() => {
    const t0 = performance.now();
    const criteria = normalizeExpenseFilters(appliedFilters, debouncedSearchTerm);
    const results = applyExpenseFiltersSync(expenses, criteria);
    
    // Explicitly sort descending by date (newest first)
    const sorted = [...results].sort((a, b) => {
      const timeA = a.__time || (a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime());
      const timeB = b.__time || (b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime());
      return timeB - timeA;
    });

    const t1 = performance.now();
    if (typeof window !== 'undefined' && (window as any).__flow_perf) {
      (window as any).__flow_perf.filterTime = Math.round(t1 - t0);
    }
    return sorted;
  }, [expenses, appliedFilters, debouncedSearchTerm]);

  const activeFiltersCount = useMemo(() => [
    appliedFilters.selectedCategories.length > 0,
    appliedFilters.dateRange !== undefined,
    appliedFilters.priceRange.min !== '' || appliedFilters.priceRange.max !== '',
    appliedFilters.onlineStatus !== 'all',
  ].filter(Boolean).length, [appliedFilters]);

  const handleClearAll = () => {
    setAppliedFilters(getEmptyExpenseFilters());
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 pb-[calc(1.5rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))] max-w-7xl h-[calc(100dvh_-_var(--app-header-total-height))] flex flex-col">
      <div className="flex flex-col flex-1 min-h-0">
        <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
             <div className="space-y-1.5">
                 <div className="flex items-center justify-between">
                     <CardTitle className="text-xl md:text-2xl font-bold text-foreground">All Expenses</CardTitle>
                     <span className="text-xs font-semibold text-muted-foreground select-none">
                       {filteredExpenses.length === expenses.length ? (
                         `Total: ${expenses.length.toLocaleString()}`
                       ) : (
                         `Showing ${filteredExpenses.length.toLocaleString()} of ${expenses.length.toLocaleString()}`
                       )}
                     </span>
                 </div>
                 <CardDescription className="text-xs text-muted-foreground">A complete history of all your transactions.</CardDescription>
             </div>
             <div className="flex items-center gap-2 mt-4">
                  <div className="relative flex-1">
                     {searchTerm !== debouncedSearchTerm ? (
                       <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
                     ) : (
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     )}
                     <Input 
                         placeholder="Search by keyword..."
                         className="pl-10 h-12 rounded-xl bg-background/50 border-input focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 text-sm"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                 <ExpensesFilterDialog 
                    appliedFilters={appliedFilters}
                    setAppliedFilters={setAppliedFilters}
                 >
                   <Button variant="outline" size="sm" className="relative h-12 w-12 p-0 sm:w-auto sm:px-4 sm:py-2 rounded-xl">
                       <ListFilter className="h-5 w-5 sm:mr-2" />
                       <span className="sr-only sm:not-sr-only">Filter</span>
                       {activeFiltersCount > 0 && (
                           <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                             {activeFiltersCount}
                           </span>
                       )}
                   </Button>
                 </ExpensesFilterDialog>
             </div>

              {/* Active Filters Summary Chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
                  {/* Category chips */}
                  {appliedFilters.selectedCategories.map((cat) => (
                    <div key={cat} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold select-none border border-primary/20">
                      <span>Category: {cat}</span>
                      <button 
                        onClick={() => setAppliedFilters(prev => ({
                          ...prev,
                          selectedCategories: prev.selectedCategories.filter(c => c !== cat)
                        }))}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove category filter for ${cat}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Date Range chip */}
                  {appliedFilters.dateRange?.from && (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold select-none border border-primary/20">
                      <span>
                        Date: {format(appliedFilters.dateRange.from, 'MMM d')}
                        {appliedFilters.dateRange.to ? ` - ${format(appliedFilters.dateRange.to, 'MMM d')}` : ''}
                      </span>
                      <button 
                        onClick={() => setAppliedFilters(prev => ({
                          ...prev,
                          dateRange: undefined
                        }))}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove date range filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Price Range chip */}
                  {(appliedFilters.priceRange.min || appliedFilters.priceRange.max) && (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold select-none border border-primary/20">
                      <span>
                        Price: {getCurrencySymbol(currency)}{appliedFilters.priceRange.min || '0'}
                        {appliedFilters.priceRange.max ? ` - ${getCurrencySymbol(currency)}${appliedFilters.priceRange.max}` : '+'}
                      </span>
                      <button 
                        onClick={() => setAppliedFilters(prev => ({
                          ...prev,
                          priceRange: { min: '', max: '' }
                        }))}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove price range filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Online/Offline status chip */}
                  {appliedFilters.onlineStatus !== 'all' && (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold select-none border border-primary/20">
                      <span className="capitalize">Channel: {appliedFilters.onlineStatus}</span>
                      <button 
                        onClick={() => setAppliedFilters(prev => ({
                          ...prev,
                          onlineStatus: 'all'
                        }))}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove online status filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                 {/* Reset/Clear All Link */}
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={handleClearAll}
                   className="text-xs text-muted-foreground hover:text-foreground h-7 px-2.5 rounded-xl"
                 >
                   Clear all
                 </Button>
               </div>
             )}
          </CardHeader>
          <CardContent className="flex-1 px-5 pb-4 min-h-0 overflow-hidden relative flex flex-col">
            <ExpensesList 
              expenses={filteredExpenses} 
              isFiltered={searchTerm !== '' || expenses.length !== filteredExpenses.length} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
